import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';
import {
  DEFAULT_APP_ICON_ID,
  getAppIconById,
  isValidAppIconId,
  renderAppIconSvg,
} from './src/appIconCatalog.ts';
import {
  clearAllUserNotifications,
  clearUserReadingProgress,
  createTradeRequest,
  deleteUserNotification,
  devAddBookReview,
  devAddSection,
  devAdjustUserTokens,
  devAssignBookOwner,
  devAssignBookSection,
  devBroadcastFeatureAnnouncement,
  devDeleteBook,
  devDeleteBookReview,
  devDeleteSection,
  devGetCodesVault,
  devGrantPermanentAccessByEmail,
  devListPendingBookReviews,
  devListPendingPriceRequests,
  devListPendingSubmissions,
  devListUsersAndPurchases,
  devModerateBookReview,
  devRenameSection,
  devReviewBookPriceRequest,
  devReviewBookSubmission,
  devRevokePermanentAccess,
  devRotateAllCodes,
  devRotateCode,
  devSetBookAuthorVerified,
  devSetItemTokenPrice,
  devSetUserVerified,
  devUpdateBookReview,
  devUpdateTokenEconomyConfig,
  devUpsertBook,
  getCatalogForUser,
  getDocumentForUser,
  getPublicUserProfile,
  getUserDirectoryForGifting,
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  preorderBookWithTokens,
  purchaseItemWithTokens,
  redeemRotatingCodeForUser,
  respondToTradeRequest,
  setUserActiveAppIcon,
  toggleComingSoonAlert,
  toggleFollowUser,
  toggleReviewLike,
  transferPremiumGift,
  upsertUserReadingProgress,
  userAddBookReview,
  userDeleteBookSubmission,
  userRequestBookPriceChange,
  userUpdateBookDiscount,
  userUpsertBookSubmission,
} from './src/db/repository.ts';
import {
  DEVELOPER_PASSCODE,
  optionalAuth,
  requireAuth,
  requireDeveloper,
  type AuthRequest,
} from './src/middleware/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/me', requireAuth, (req: AuthRequest, res) => {
    res.json({
      uid: req.user?.uid,
      email: req.user?.email,
      name: req.user?.name,
    });
  });

  app.get('/api/catalog', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const catalog = await getCatalogForUser(req.user?.uid ?? null);
      res.json(catalog);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load catalog';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/books/:id/notify-me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bookId = String(req.params.id ?? '').trim();
      if (!bookId) {
        res.status(400).json({ error: 'Invalid bookId' });
        return;
      }
      const result = await toggleComingSoonAlert(req.user!.uid, bookId);
      if (!result.ok) {
        res.status(400).json({ error: result.error });
        return;
      }
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ...result, catalog });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to update launch alert subscription';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/unlock/code', requireAuth, async (req: AuthRequest, res) => {
    try {
      const code = String(req.body?.code ?? '');
      const targetId = typeof req.body?.targetId === 'string' ? req.body.targetId : undefined;
      const result = await redeemRotatingCodeForUser(req.user!.uid, code, targetId);
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to verify code';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/unlock/tokens', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { targetType, targetId } = req.body ?? {};
      if (
        (targetType !== 'book' && targetType !== 'theme' && targetType !== 'icon') ||
        typeof targetId !== 'string' ||
        !targetId.trim()
      ) {
        res.status(400).json({ ok: false, error: 'Invalid premium unlock target' });
        return;
      }
      const result = await purchaseItemWithTokens(req.user!.uid, targetType, targetId);
      if (!result.ok) {
        res.status(400).json(result);
        return;
      }
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ...result, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to unlock with golden tokens';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/books/:bookId/preorder', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bookId = String(req.params.bookId ?? '').trim();
      if (!bookId) {
        res.status(400).json({ ok: false, error: 'Invalid bookId' });
        return;
      }
      const result = await preorderBookWithTokens(req.user!.uid, bookId);
      if (!result.ok) {
        res.status(400).json(result);
        return;
      }
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ...result, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to pre-order book';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/books/:bookId/reviews', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bookId = String(req.params.bookId ?? '').trim();
      const { rating, comment } = req.body ?? {};
      if (!bookId) {
        res.status(400).json({ ok: false, error: 'Invalid bookId' });
        return;
      }
      const result = await userAddBookReview(
        req.user!.uid,
        bookId,
        Number(rating ?? 5),
        String(comment ?? '')
      );
      if (!result.ok) {
        res.status(400).json(result);
        return;
      }
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ...result, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to submit review';
      res.status(500).json({ error: message });
    }
  });

  app.put('/api/progress', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { bookId, chapterIndex, scrollRatio, bookmarks, lastReadAt } = req.body ?? {};
      if (!bookId || typeof bookId !== 'string') {
        res.status(400).json({ error: 'Invalid bookId' });
        return;
      }
      const { completedNow } = await upsertUserReadingProgress(req.user!.uid, {
        bookId,
        chapterIndex: Number(chapterIndex) || 0,
        scrollRatio: Number(scrollRatio) || 0,
        bookmarks: Array.isArray(bookmarks) ? bookmarks.map(Number) : [],
        lastReadAt: typeof lastReadAt === 'string' ? lastReadAt : new Date().toISOString(),
      });
      if (completedNow) {
        const notifData = await getUserNotifications(req.user!.uid);
        res.json({ ok: true, completedNow: true, ...notifData });
        return;
      }
      res.json({ ok: true, completedNow: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save progress';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/notifications', requireAuth, async (req: AuthRequest, res) => {
    try {
      const data = await getUserNotifications(req.user!.uid);
      res.json({ ok: true, ...data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load notifications';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/notifications/read-all', requireAuth, async (req: AuthRequest, res) => {
    try {
      await markAllNotificationsRead(req.user!.uid);
      const data = await getUserNotifications(req.user!.uid);
      res.json({ ok: true, ...data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to mark notifications read';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = String(req.params.id ?? '');
      await markNotificationRead(req.user!.uid, id);
      const data = await getUserNotifications(req.user!.uid);
      res.json({ ok: true, ...data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to mark notification read';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/notifications', requireAuth, async (req: AuthRequest, res) => {
    try {
      await clearAllUserNotifications(req.user!.uid);
      res.json({ ok: true, notifications: [], unreadCount: 0 });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to clear notifications';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/notifications/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = String(req.params.id ?? '');
      await deleteUserNotification(req.user!.uid, id);
      const data = await getUserNotifications(req.user!.uid);
      res.json({ ok: true, ...data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete notification';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/progress', requireAuth, async (req: AuthRequest, res) => {
    try {
      await clearUserReadingProgress(req.user!.uid);
      res.json({ ok: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to clear progress';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/documents/:pdfId', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const pdfId = String(req.params.pdfId ?? '');
      const isDev = String(req.headers['x-developer-passcode'] ?? '').trim() === DEVELOPER_PASSCODE;
      const doc = await getDocumentForUser(req.user?.uid ?? null, pdfId, isDev);
      if (!doc.found) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      if (!doc.allowed) {
        res.status(403).json({ error: 'Premium book access required' });
        return;
      }
      res.json({
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        dataBase64: doc.dataBase64,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load document';
      res.status(500).json({ error: message });
    }
  });

  // Developer routes (Developer Passcode required; Firebase Auth optional)
  app.post('/api/dev/verify', optionalAuth, requireDeveloper, (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/dev/codes', requireAuth, requireDeveloper, async (_req, res) => {
    try {
      const entries = await devGetCodesVault();
      res.json({ entries });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch codes';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/dev/codes/rotate', requireAuth, requireDeveloper, async (req, res) => {
    try {
      const { targetType, targetId, customCode, rotationHours } = req.body ?? {};
      if (
        (targetType !== 'book' && targetType !== 'theme' && targetType !== 'icon') ||
        typeof targetId !== 'string'
      ) {
        res.status(400).json({ error: 'Invalid target' });
        return;
      }
      const result = await devRotateCode(
        targetType,
        targetId,
        typeof customCode === 'string' ? customCode : undefined,
        typeof rotationHours === 'number' ? rotationHours : undefined
      );
      if (!result.ok) {
        res.status(400).json(result);
        return;
      }
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to rotate code';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/dev/codes/rotate-all', requireAuth, requireDeveloper, async (_req, res) => {
    try {
      await devRotateAllCodes();
      const entries = await devGetCodesVault();
      res.json({ ok: true, entries });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to rotate all codes';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/user/books', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { book, documentPayload } = req.body ?? {};
      if (!book || typeof book.id !== 'string' || typeof book.title !== 'string') {
        res.status(400).json({ error: 'Invalid book submission payload' });
        return;
      }
      const result = await userUpsertBookSubmission(req.user!.uid, book, documentPayload);
      if (!result.ok) {
        res.status(result.error?.startsWith('Forbidden') ? 403 : 400).json({ error: result.error });
        return;
      }
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ok: true, bookId: result.bookId, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to submit book for review';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/user/books/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bookId = String(req.params.id ?? '').trim();
      if (!bookId) {
        res.status(400).json({ error: 'Invalid bookId' });
        return;
      }
      const result = await userDeleteBookSubmission(req.user!.uid, bookId);
      if (!result.ok) {
        res.status(result.error?.startsWith('Forbidden') ? 403 : 400).json({ error: result.error });
        return;
      }
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ok: true, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete submission';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/user/books/:bookId/price-request', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bookId = String(req.params.bookId ?? '').trim();
      const { tokenPrice } = req.body ?? {};
      if (!bookId || tokenPrice === undefined || tokenPrice === null) {
        res.status(400).json({ error: 'Book ID and tokenPrice are required.' });
        return;
      }
      const result = await userRequestBookPriceChange(req.user!.uid, bookId, Number(tokenPrice));
      if (!result.ok) {
        res.status(result.error?.startsWith('Forbidden') ? 403 : 400).json({ error: result.error });
        return;
      }
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ok: true, catalog });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to submit book price update request';
      res.status(500).json({ error: message });
    }
  });

  app.put('/api/user/books/:bookId/discount', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bookId = String(req.params.bookId ?? '').trim();
      const { discountPercent, discountEndsAt, discountPostReleaseDays } = req.body ?? {};
      if (!bookId) {
        res.status(400).json({ error: 'Book ID is required.' });
        return;
      }
      const parsedDiscount =
        discountPercent === null || discountPercent === undefined || discountPercent === ''
          ? null
          : Number(discountPercent);
      const parsedPostReleaseDays =
        discountPostReleaseDays === null ||
        discountPostReleaseDays === undefined ||
        discountPostReleaseDays === ''
          ? null
          : Number(discountPostReleaseDays);
      const result = await userUpdateBookDiscount(req.user!.uid, bookId, {
        discountPercent: parsedDiscount,
        discountEndsAt: typeof discountEndsAt === 'string' ? discountEndsAt : null,
        discountPostReleaseDays: parsedPostReleaseDays,
      });
      if (!result.ok) {
        res.status(result.error?.startsWith('Forbidden') ? 403 : 400).json({ error: result.error });
        return;
      }
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ok: true, catalog });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to update book sale discount';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/dev/submissions', optionalAuth, requireDeveloper, async (_req, res) => {
    try {
      const [submissions, priceRequests, pendingReviews] = await Promise.all([
        devListPendingSubmissions(),
        devListPendingPriceRequests(),
        devListPendingBookReviews(),
      ]);
      res.json({ ok: true, submissions, priceRequests, pendingReviews });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to load pending submissions';
      res.status(500).json({ error: message });
    }
  });

  app.post(
    '/api/dev/submissions/:bookId/review',
    optionalAuth,
    requireDeveloper,
    async (req: AuthRequest, res) => {
      try {
        const bookId = String(req.params.bookId ?? '').trim();
        const { decision, reviewNote } = req.body ?? {};
        if (!bookId || (decision !== 'approve' && decision !== 'reject')) {
          res.status(400).json({ error: 'Invalid review decision' });
          return;
        }
        const result = await devReviewBookSubmission(
          bookId,
          decision,
          typeof reviewNote === 'string' ? reviewNote : undefined
        );
        if (!result.ok) {
          res.status(404).json({ error: result.error });
          return;
        }
        const [catalog, submissions, priceRequests] = await Promise.all([
          getCatalogForUser(req.user?.uid ?? null),
          devListPendingSubmissions(),
          devListPendingPriceRequests(),
        ]);
        res.json({ ...result, catalog, submissions, priceRequests });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to review book submission';
        res.status(500).json({ error: message });
      }
    }
  );

  app.post(
    '/api/dev/price-requests/:bookId/review',
    optionalAuth,
    requireDeveloper,
    async (req: AuthRequest, res) => {
      try {
        const bookId = String(req.params.bookId ?? '').trim();
        const { decision, reviewNote } = req.body ?? {};
        if (!bookId || (decision !== 'approve' && decision !== 'reject')) {
          res.status(400).json({ error: 'Invalid price review decision' });
          return;
        }
        const result = await devReviewBookPriceRequest(
          bookId,
          decision,
          typeof reviewNote === 'string' ? reviewNote : undefined
        );
        if (!result.ok) {
          res.status(400).json({ error: result.error });
          return;
        }
        const [catalog, priceRequests] = await Promise.all([
          getCatalogForUser(req.user?.uid ?? null),
          devListPendingPriceRequests(),
        ]);
        res.json({ ...result, catalog, priceRequests });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to review price change request';
        res.status(500).json({ error: message });
      }
    }
  );

  app.post(
    '/api/dev/announcements',
    optionalAuth,
    requireDeveloper,
    async (req: AuthRequest, res) => {
      try {
        const { titleAr, titleEn, messageAr, messageEn, targetView, targetSection } = req.body ?? {};
        const result = await devBroadcastFeatureAnnouncement({
          titleAr: String(titleAr ?? ''),
          titleEn: typeof titleEn === 'string' ? titleEn : undefined,
          messageAr: String(messageAr ?? ''),
          messageEn: typeof messageEn === 'string' ? messageEn : undefined,
          targetView: String(targetView ?? 'you'),
          targetSection: typeof targetSection === 'string' ? targetSection : null,
        });
        if (!result.ok) {
          res.status(400).json({ error: result.error });
          return;
        }
        const catalog = await getCatalogForUser(req.user?.uid ?? null);
        res.json({ ...result, catalog });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to broadcast feature announcement';
        res.status(500).json({ error: message });
      }
    }
  );

  app.post('/api/dev/books', optionalAuth, requireDeveloper, async (req: AuthRequest, res) => {
    try {
      const { book, documentPayload, notifyFollowers } = req.body ?? {};
      if (!book || !book.id || !book.title) {
        res.status(400).json({ error: 'Invalid book payload' });
        return;
      }
      const result = await devUpsertBook(
        book,
        documentPayload,
        notifyFollowers !== undefined ? { notifyFollowers: Boolean(notifyFollowers) } : undefined
      );
      if (!result.ok) {
        res.status(400).json({ error: result.error ?? 'Failed to validate book release requirements' });
        return;
      }
      const catalog = await getCatalogForUser(req.user?.uid ?? null);
      res.json({ ok: true, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save book';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/dev/books/:id', optionalAuth, requireDeveloper, async (req: AuthRequest, res) => {
    try {
      const bookId = String(req.params.id ?? '');
      await devDeleteBook(bookId);
      const catalog = await getCatalogForUser(req.user?.uid ?? null);
      res.json({ ok: true, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete book';
      res.status(500).json({ error: message });
    }
  });

  app.post(
    '/api/dev/books/:bookId/reviews',
    optionalAuth,
    requireDeveloper,
    async (req: AuthRequest, res) => {
      try {
        const bookId = String(req.params.bookId ?? '');
        const { reviewerName, rating, comment, isOwner, isVerified, reviewerUid } = req.body ?? {};
        const result = await devAddBookReview(
          bookId,
          String(reviewerName ?? ''),
          Number(rating ?? 5),
          String(comment ?? ''),
          Boolean(isOwner),
          Boolean(isVerified),
          typeof reviewerUid === 'string' && reviewerUid.trim() ? reviewerUid.trim() : null
        );
        if (!result.ok) {
          res.status(400).json(result);
          return;
        }
        const catalog = await getCatalogForUser(req.user?.uid ?? null);
        res.json({ ...result, catalog });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to add book review';
        res.status(500).json({ error: message });
      }
    }
  );

  app.put(
    '/api/dev/reviews/:reviewId',
    optionalAuth,
    requireDeveloper,
    async (req: AuthRequest, res) => {
      try {
        const reviewId = String(req.params.reviewId ?? '');
        const { reviewerName, rating, comment, isOwner, isVerified, reviewerUid } = req.body ?? {};
        const result = await devUpdateBookReview(
          reviewId,
          String(reviewerName ?? ''),
          Number(rating ?? 5),
          String(comment ?? ''),
          Boolean(isOwner),
          Boolean(isVerified),
          typeof reviewerUid === 'string' && reviewerUid.trim() ? reviewerUid.trim() : null
        );
        if (!result.ok) {
          res.status(400).json(result);
          return;
        }
        const catalog = await getCatalogForUser(req.user?.uid ?? null);
        res.json({ ...result, catalog });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to update book review';
        res.status(500).json({ error: message });
      }
    }
  );

  app.delete(
    '/api/dev/reviews/:reviewId',
    optionalAuth,
    requireDeveloper,
    async (req: AuthRequest, res) => {
      try {
        const reviewId = String(req.params.reviewId ?? '');
        const result = await devDeleteBookReview(reviewId);
        if (!result.ok) {
          res.status(404).json(result);
          return;
        }
        const catalog = await getCatalogForUser(req.user?.uid ?? null);
        res.json({ ...result, catalog });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to delete book review';
        res.status(500).json({ error: message });
      }
    }
  );

  app.post(
    '/api/dev/reviews/:reviewId/moderate',
    optionalAuth,
    requireDeveloper,
    async (req: AuthRequest, res) => {
      try {
        const reviewId = String(req.params.reviewId ?? '').trim();
        const { decision, moderationNote } = req.body ?? {};
        if (!reviewId || (decision !== 'approve' && decision !== 'reject')) {
          res.status(400).json({ error: 'Invalid review moderation decision.' });
          return;
        }
        const noteStr = typeof moderationNote === 'string' ? moderationNote : undefined;
        if (decision === 'reject' && (!noteStr || !noteStr.trim())) {
          res.status(400).json({ error: 'يرجى كتابة سبب الرفض ليظهر لصاحب التقييم.' });
          return;
        }
        const result = await devModerateBookReview(reviewId, decision, noteStr);
        if (!result.ok) {
          res.status(400).json(result);
          return;
        }
        const [catalog, pendingReviews] = await Promise.all([
          getCatalogForUser(req.user?.uid ?? null),
          devListPendingBookReviews(),
        ]);
        res.json({ ...result, catalog, pendingReviews });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to moderate reader review';
        res.status(500).json({ error: message });
      }
    }
  );

  app.post('/api/dev/sections', requireAuth, requireDeveloper, async (req: AuthRequest, res) => {
    try {
      const { name, englishName } = req.body ?? {};
      const result = await devAddSection(String(name ?? ''), typeof englishName === 'string' ? englishName : undefined);
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ...result, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add section';
      res.status(500).json({ error: message });
    }
  });

  app.put('/api/dev/sections/:name', requireAuth, requireDeveloper, async (req: AuthRequest, res) => {
    try {
      const oldName = decodeURIComponent(String(req.params.name ?? ''));
      const { newName, englishName } = req.body ?? {};
      const result = await devRenameSection(
        oldName,
        String(newName ?? ''),
        typeof englishName === 'string' ? englishName : undefined
      );
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ...result, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to rename section';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/dev/sections/:name', requireAuth, requireDeveloper, async (req: AuthRequest, res) => {
    try {
      const sectionName = decodeURIComponent(String(req.params.name ?? ''));
      const fallbackSection =
        typeof req.query.fallback === 'string' ? req.query.fallback : undefined;
      const result = await devDeleteSection(sectionName, fallbackSection);
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ...result, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete section';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/dev/books/:id/section', requireAuth, requireDeveloper, async (req: AuthRequest, res) => {
    try {
      const bookId = String(req.params.id ?? '');
      const { sectionName } = req.body ?? {};
      await devAssignBookSection(bookId, String(sectionName ?? ''));
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ok: true, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to move book';
      res.status(500).json({ error: message });
    }
  });

  app.patch(
    '/api/dev/books/:id/author-verified',
    optionalAuth,
    requireDeveloper,
    async (req: AuthRequest, res) => {
      try {
        const bookId = String(req.params.id ?? '');
        const { isAuthorVerified } = req.body ?? {};
        await devSetBookAuthorVerified(bookId, Boolean(isAuthorVerified));
        const catalog = await getCatalogForUser(req.user?.uid ?? null);
        res.json({ ok: true, catalog });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to update author verification';
        res.status(500).json({ error: message });
      }
    }
  );

  app.patch(
    '/api/dev/books/:id/owner',
    optionalAuth,
    requireDeveloper,
    async (req: AuthRequest, res) => {
      try {
        const bookId = String(req.params.id ?? '');
        const { authorUid, notifyFollowers } = req.body ?? {};
        const result = await devAssignBookOwner(
          bookId,
          typeof authorUid === 'string' ? authorUid : null,
          Boolean(notifyFollowers)
        );
        if (!result.ok) {
          res.status(404).json({ error: result.error });
          return;
        }
        const catalog = await getCatalogForUser(req.user?.uid ?? null);
        res.json({ ok: true, catalog });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to link book to user account';
        res.status(500).json({ error: message });
      }
    }
  );

  app.post('/api/reviews/:reviewId/like', requireAuth, async (req: AuthRequest, res) => {
    try {
      const reviewId = String(req.params.reviewId ?? '');
      const result = await toggleReviewLike(req.user!.uid, reviewId);
      if (!result.ok) {
        res.status(404).json({ error: result.error });
        return;
      }
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ...result, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update comment like';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/users/directory', requireAuth, async (req: AuthRequest, res) => {
    try {
      const accounts = await getUserDirectoryForGifting(req.user!.uid);
      res.json({ ok: true, accounts });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load user directory';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/gifts/transfer', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { recipientUid, targetType, targetId } = req.body ?? {};
      if (
        typeof recipientUid !== 'string' ||
        !recipientUid.trim() ||
        (targetType !== 'book' && targetType !== 'theme') ||
        typeof targetId !== 'string' ||
        !targetId.trim()
      ) {
        res.status(400).json({ error: 'Invalid gift transfer request' });
        return;
      }
      const result = await transferPremiumGift(
        req.user!.uid,
        recipientUid.trim(),
        targetType,
        targetId.trim()
      );
      if (!result.ok) {
        res.status(400).json({ error: result.error });
        return;
      }
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ...result, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to transfer gift';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/trades', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { recipientUid, offeredType, offeredId, requestedType, requestedId } = req.body ?? {};
      if (
        typeof recipientUid !== 'string' ||
        !recipientUid.trim() ||
        (offeredType !== 'book' && offeredType !== 'theme') ||
        typeof offeredId !== 'string' ||
        !offeredId.trim() ||
        (requestedType !== 'book' && requestedType !== 'theme') ||
        typeof requestedId !== 'string' ||
        !requestedId.trim()
      ) {
        res.status(400).json({ error: 'Invalid trade request payload' });
        return;
      }

      const result = await createTradeRequest(req.user!.uid, {
        recipientUid: recipientUid.trim(),
        offeredType,
        offeredId: offeredId.trim(),
        requestedType,
        requestedId: requestedId.trim(),
      });
      if (!result.ok) {
        res.status(400).json({ error: result.error });
        return;
      }
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ...result, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create trade request';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/trades/:id/respond', requireAuth, async (req: AuthRequest, res) => {
    try {
      const tradeId = String(req.params.id ?? '').trim();
      const { decision } = req.body ?? {};
      if (
        !tradeId ||
        (decision !== 'accept' && decision !== 'decline' && decision !== 'cancel')
      ) {
        res.status(400).json({ error: 'Invalid trade response' });
        return;
      }
      const result = await respondToTradeRequest(req.user!.uid, tradeId, decision);
      if (!result.ok) {
        res.status(400).json({ error: result.error });
        return;
      }
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ...result, catalog });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to respond to trade request';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/users/:uid/profile', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const targetUid = String(req.params.uid ?? '');
      const profile = await getPublicUserProfile(targetUid, req.user?.uid ?? null);
      if (!profile) {
        res.status(404).json({ error: 'User account not found' });
        return;
      }
      res.json({ ok: true, profile });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load profile';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/users/:uid/follow', requireAuth, async (req: AuthRequest, res) => {
    try {
      const targetUid = String(req.params.uid ?? '');
      const result = await toggleFollowUser(req.user!.uid, targetUid, true);
      if (!result.ok) {
        res.status(400).json({ error: result.error });
        return;
      }
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ...result, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to follow user';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/users/:uid/follow', requireAuth, async (req: AuthRequest, res) => {
    try {
      const targetUid = String(req.params.uid ?? '');
      const result = await toggleFollowUser(req.user!.uid, targetUid, false);
      if (!result.ok) {
        res.status(400).json({ error: result.error });
        return;
      }
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ...result, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to unfollow user';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/dev/catalog/import', requireAuth, requireDeveloper, async (req: AuthRequest, res) => {
    try {
      const payload = req.body;
      if (!payload || !Array.isArray(payload.books)) {
        res.status(400).json({ error: 'Invalid catalog payload' });
        return;
      }
      if (Array.isArray(payload.sections)) {
        for (const sec of payload.sections) {
          if (typeof sec === 'string' && sec.trim()) {
            const en = payload.sectionTranslations?.[sec];
            await devAddSection(sec, en);
          }
        }
      }
      for (const b of payload.books) {
        await devUpsertBook(b);
      }
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ok: true, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to import catalog';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/dev/users', requireAuth, requireDeveloper, async (_req, res) => {
    try {
      const usersList = await devListUsersAndPurchases();
      res.json({ users: usersList });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load users';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/dev/users/:userUid/verify', requireAuth, requireDeveloper, async (req, res) => {
    try {
      const userUid = String(req.params.userUid ?? '');
      const { isVerified } = req.body ?? {};
      const result = await devSetUserVerified(userUid, Boolean(isVerified));
      if (!result.ok) {
        res.status(404).json(result);
        return;
      }
      res.json({ ok: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update user verification';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/dev/users/:userUid/tokens', requireAuth, requireDeveloper, async (req, res) => {
    try {
      const userUid = String(req.params.userUid ?? '').trim();
      const { mode, amount, note } = req.body ?? {};
      if (!userUid || (mode !== 'add' && mode !== 'set')) {
        res.status(400).json({ ok: false, error: 'Invalid token adjustment payload' });
        return;
      }
      const result = await devAdjustUserTokens(
        userUid,
        mode,
        Number(amount),
        typeof note === 'string' ? note : undefined
      );
      if (!result.ok) {
        res.status(400).json(result);
        return;
      }
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to adjust user tokens';
      res.status(500).json({ error: message });
    }
  });

  app.put('/api/dev/economy/config', optionalAuth, requireDeveloper, async (req: AuthRequest, res) => {
    try {
      const economyConfig = await devUpdateTokenEconomyConfig(req.body ?? {});
      const catalog = await getCatalogForUser(req.user?.uid ?? null);
      res.json({ ok: true, economyConfig, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update economy settings';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/dev/economy/price', optionalAuth, requireDeveloper, async (req: AuthRequest, res) => {
    try {
      const { targetType, targetId, tokenPrice } = req.body ?? {};
      if (
        (targetType !== 'book' && targetType !== 'theme' && targetType !== 'icon') ||
        typeof targetId !== 'string' ||
        !targetId.trim()
      ) {
        res.status(400).json({ ok: false, error: 'Invalid target item' });
        return;
      }
      const parsedPrice =
        tokenPrice === null || tokenPrice === '' || tokenPrice === undefined
          ? null
          : Number(tokenPrice);
      const result = await devSetItemTokenPrice(targetType, targetId.trim(), parsedPrice);
      if (!result.ok) {
        res.status(404).json(result);
        return;
      }
      const catalog = await getCatalogForUser(req.user?.uid ?? null);
      res.json({ ...result, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update item price';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/dev/purchases/grant', requireAuth, requireDeveloper, async (req, res) => {
    try {
      const { email, targetType, targetId } = req.body ?? {};
      if (
        !email ||
        (targetType !== 'book' && targetType !== 'theme' && targetType !== 'icon') ||
        !targetId
      ) {
        res.status(400).json({ error: 'Invalid grant request' });
        return;
      }
      const result = await devGrantPermanentAccessByEmail(String(email), targetType, String(targetId));
      if (!result.ok) {
        res.status(404).json(result);
        return;
      }
      res.json({ ok: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to grant access';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/dev/purchases', requireAuth, requireDeveloper, async (req, res) => {
    try {
      const { userUid, targetType, targetId } = req.body ?? {};
      if (
        !userUid ||
        (targetType !== 'book' && targetType !== 'theme' && targetType !== 'icon') ||
        !targetId
      ) {
        res.status(400).json({ error: 'Invalid revoke request' });
        return;
      }
      await devRevokePermanentAccess(String(userUid), targetType, String(targetId));
      res.json({ ok: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to revoke access';
      res.status(500).json({ error: message });
    }
  });

  // --- Dynamic App Icon & Web App Manifest Routes (same browser tab geometry, custom colorways) ---
  const pngIconCache = new Map<string, Buffer>();

  app.put('/api/user/app-icon', requireAuth, async (req: AuthRequest, res) => {
    try {
      const iconId = String(req.body?.iconId ?? '').trim();
      const result = await setUserActiveAppIcon(req.user!.uid, iconId);
      if (!result.ok) {
        res.status(400).json(result);
        return;
      }
      const catalog = await getCatalogForUser(req.user!.uid);
      res.json({ ok: true, activeIconId: result.activeIconId, catalog });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save active app icon';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/app-icon/:iconId.svg', (req, res) => {
    const rawId = String(req.params.iconId ?? '').trim();
    const iconId = isValidAppIconId(rawId) ? rawId : DEFAULT_APP_ICON_ID;
    const rawSize = Number(req.query.size);
    const size = Number.isFinite(rawSize) ? Math.min(1024, Math.max(16, Math.round(rawSize))) : 512;
    const maskable = req.query.maskable === '1' || req.query.maskable === 'true';
    const svg = renderAppIconSvg(iconId, {
      size,
      maskable,
      idPrefix: `${iconId}-${maskable ? 'm' : 'r'}-${size}`,
    });
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(svg);
  });

  app.get('/api/app-icon/:iconId.png', (req, res) => {
    try {
      const rawId = String(req.params.iconId ?? '').trim();
      const iconId = isValidAppIconId(rawId) ? rawId : DEFAULT_APP_ICON_ID;
      const rawSize = Number(req.query.size);
      const size = Number.isFinite(rawSize) ? Math.min(1024, Math.max(16, Math.round(rawSize))) : 512;
      const maskable = req.query.maskable === '1' || req.query.maskable === 'true';
      const cacheKey = `${iconId}:${size}:${maskable ? '1' : '0'}`;

      let pngBuffer = pngIconCache.get(cacheKey);
      if (!pngBuffer) {
        const svg = renderAppIconSvg(iconId, {
          size: 512,
          maskable,
          idPrefix: `${iconId}-${maskable ? 'm' : 'r'}`,
        });
        const rendered = new Resvg(svg, {
          fitTo: { mode: 'width', value: size },
        }).render();
        pngBuffer = rendered.asPng();
        if (pngIconCache.size >= 120) {
          const oldestKey = pngIconCache.keys().next().value;
          if (oldestKey) pngIconCache.delete(oldestKey);
        }
        pngIconCache.set(cacheKey, pngBuffer);
      }

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(pngBuffer);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to render PNG app icon';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/manifest.webmanifest', (req, res) => {
    const rawIcon = typeof req.query.icon === 'string' ? req.query.icon.trim() : '';
    const iconId = isValidAppIconId(rawIcon) ? rawIcon : DEFAULT_APP_ICON_ID;
    const icon = getAppIconById(iconId);
    const isEn = req.query.lang === 'en';
    const manifest = {
      id: '/',
      name: isEn ? 'maktabty — Digital Library' : 'مكتبتي maktabty',
      short_name: isEn ? 'maktabty' : 'مكتبتي',
      description: isEn
        ? 'Offline-first digital book library with cloud sync and instant reading.'
        : 'منصة كتب رقمية للقراءة الفورية دون اتصال بالإنترنت عبر IndexedDB وتحديث تلقائي.',
      lang: isEn ? 'en' : 'ar',
      dir: isEn ? 'ltr' : 'rtl',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait-primary',
      background_color: icon.themeColor,
      theme_color: icon.themeColor,
      icons: [
        {
          src: `/api/app-icon/${icon.id}.png?size=192`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: `/api/app-icon/${icon.id}.png?size=512`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: `/api/app-icon/${icon.id}.png?size=512&maskable=1`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: `/api/app-icon/${icon.id}.svg`,
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any',
        },
      ],
    };

    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.send(JSON.stringify(manifest, null, 2));
  });

  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      if (
        req.path === '/sw.js' ||
        req.path === '/' ||
        req.path === '/index.html' ||
        req.path === '/manifest.json' ||
        req.path === '/manifest.webmanifest'
      ) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      }
      if (req.path === '/manifest.json' || req.path === '/manifest.webmanifest') {
        res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      }
      next();
    });

    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      plugins: [
        {
          name: 'disable-vite-ws-client',
          enforce: 'post',
          transform(code, id) {
            if (id.includes('vite/dist/client/client.mjs') || id.endsWith('/@vite/client')) {
              return code.replace(
                'transport.connect(createHMRHandler(handleMessage));',
                'void 0;'
              );
            }
            return null;
          },
        },
      ],
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(
      express.static(distPath, {
        index: false,
        setHeaders: (res, filePath) => {
          if (
            filePath.endsWith('.html') ||
            filePath.endsWith(`${path.sep}sw.js`) ||
            filePath.endsWith(`${path.sep}manifest.json`) ||
            filePath.endsWith(`${path.sep}manifest.webmanifest`)
          ) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
            if (
              filePath.endsWith(`${path.sep}manifest.json`) ||
              filePath.endsWith(`${path.sep}manifest.webmanifest`)
            ) {
              res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
            }
          } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );
    app.get('*', (req, res) => {
      if (
        req.path.startsWith('/assets/') ||
        req.path.startsWith('/api/') ||
        /\.(js|mjs|css|map|png|jpg|jpeg|webp|svg|ico|woff|woff2|json)$/i.test(req.path)
      ) {
        res.status(404).end();
        return;
      }
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

void startServer();
