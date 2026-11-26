import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser } from '../db/repository.ts';

export const DEVELOPER_PASSCODE = process.env.DEVELOPER_PASSCODE || '3072009';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email ?? `${decodedToken.uid}@user.local`,
      decodedToken.name ?? decodedToken.email?.split('@')[0] ?? 'Reader'
    );
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email ?? `${decodedToken.uid}@user.local`,
      decodedToken.name ?? decodedToken.email?.split('@')[0] ?? 'Reader'
    );
  } catch {
    // Proceed as unauthenticated guest if token is missing/expired
  }
  next();
};

export const requireDeveloper = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const passcode = String(req.headers['x-developer-passcode'] ?? '').trim();
  if (passcode !== DEVELOPER_PASSCODE) {
    res.status(403).json({ error: 'Forbidden: Invalid developer passcode' });
    return;
  }
  next();
};
