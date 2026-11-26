import { and, asc, desc, eq, gte, inArray, or, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  bookDocuments,
  bookPreorders,
  bookReviewLikes,
  bookReviews,
  books,
  catalogMeta,
  comingSoonAlerts,
  librarySections,
  premiumIcons,
  premiumThemes,
  premiumTradeRequests,
  readingProgress,
  tokenTransactions,
  userBookPurchases,
  userCodeGrants,
  userFollows,
  userIconPurchases,
  userNotifications,
  users,
  userThemePurchases,
  type ChapterRow,
} from './schema.ts';
import {
  DEFAULT_APP_ICON_ID,
  getAppIconById,
  isValidAppIconId,
  PREMIUM_APP_ICONS,
} from '../appIconCatalog.ts';
import { THEME_CATALOG } from '../themeCatalog.ts';
import {
  INITIAL_BOOKS,
  INITIAL_PREMIUM_THEME_CODES,
  INITIAL_SECTIONS,
} from './seedCatalog.ts';

export type AccessType = 'free' | 'purchased' | 'code' | 'locked';

export interface TokenEconomyConfig {
  welcomeBonusTokens: number;
  defaultPremiumBookPrice: number;
  defaultPremiumThemePrice: number;
  defaultPremiumIconPrice: number;
  publishRegularBookCost: number;
  publishPremiumBookCost: number;
  rewardCommentOnBook: number;
  rewardBookRatingAbove4: number;
  rewardBookCompleted: number;
  rewardNewFollower: number;
  rewardReviewLike: number;
  rewardBookApproved: number;
}

export const DEFAULT_TOKEN_ECONOMY_CONFIG: TokenEconomyConfig = {
  welcomeBonusTokens: 50,
  defaultPremiumBookPrice: 40,
  defaultPremiumThemePrice: 60,
  defaultPremiumIconPrice: 50,
  publishRegularBookCost: 15,
  publishPremiumBookCost: 30,
  rewardCommentOnBook: 5,
  rewardBookRatingAbove4: 35,
  rewardBookCompleted: 12,
  rewardNewFollower: 8,
  rewardReviewLike: 3,
  rewardBookApproved: 20,
};

export interface TokenTransactionDTO {
  id: string;
  amount: number;
  kind: string;
  descriptionAr: string;
  descriptionEn: string;
  targetBookId: string | null;
  targetThemeId: string | null;
  createdAt: string;
}

export interface BookReviewDTO {
  id: string;
  bookId: string;
  reviewerUid: string | null;
  reviewerName: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  isOwner: boolean;
  likesCount: number;
  likedByMe: boolean;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  moderationNote?: string | null;
  createdAt: string;
}

export interface PendingBookReviewDTO {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCoverUrl: string;
  reviewerUid: string | null;
  reviewerName: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: string;
}

export interface DirectoryAccountDTO {
  uid: string;
  displayName: string;
  isVerified: boolean;
  followersCount: number;
  publishedBooksCount: number;
  isFollowing: boolean;
  ownedBookIds: string[];
  ownedThemeIds: string[];
}

export interface BookAuthorAccountDTO {
  uid: string;
  displayName: string;
  isVerified: boolean;
  followersCount: number;
  isFollowing: boolean;
}

export interface ServerBookDTO {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  authorUid: string | null;
  authorAccount: BookAuthorAccountDTO | null;
  isAuthorVerified: boolean;
  category: string;
  year: number;
  pages: number;
  readingMinutes: number;
  rating: number;
  reviews: BookReviewDTO[];
  myPendingReview?: BookReviewDTO | null;
  version: number;
  updatedAt: string;
  addedAt?: string;
  featured: boolean;
  isComingSoon: boolean;
  comingSoonMode?: 'open' | 'date' | 'datetime';
  comingSoonReleaseAt?: string;
  isNotifySubscribed: boolean;
  notifySubscribersCount: number;
  isPreordered?: boolean;
  preordersCount?: number;
  isPremium: boolean;
  priceLabel: string;
  tokenPrice: number | null;
  baseTokenPrice: number;
  effectiveTokenPrice: number;
  discountPercent?: number | null;
  discountStartedAt?: string | null;
  discountEndsAt?: string | null;
  discountPostReleaseDays?: number | null;
  pendingTokenPrice?: number | null;
  priceReviewStatus?: 'pending' | 'rejected' | null;
  priceReviewNote?: string | null;
  priceSubmittedAt?: string | null;
  publishTokensPaid: number;
  rotationHours: number;
  codeExpiresAt?: string;
  accessType: AccessType;
  isUnlocked: boolean;
  purchasedAt?: string;
  codeAccessExpiresAt?: string;
  bookType: 'text' | 'pdf' | 'word';
  pdfId?: string;
  pdfPageCount?: number;
  coverUrl: string;
  synopsis: string;
  chapters: ChapterRow[];
  reviewStatus?: 'approved' | 'pending' | 'rejected';
  reviewNote?: string | null;
  submittedAt?: string | null;
  seriesId?: string | null;
  seriesTitle?: string | null;
  partNumber?: number | null;
}

export interface PremiumTradeRequestDTO {
  id: string;
  senderUid: string;
  senderDisplayName: string;
  senderIsVerified: boolean;
  recipientUid: string;
  recipientDisplayName: string;
  recipientIsVerified: boolean;
  offeredType: 'book' | 'theme';
  offeredId: string;
  requestedType: 'book' | 'theme';
  requestedId: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  respondedAt: string | null;
  createdAt: string;
}

export interface ServerThemeAccessDTO {
  themeId: string;
  isUnlocked: boolean;
  accessType: 'purchased' | 'code' | 'locked';
  purchasedAt?: string;
  codeAccessExpiresAt?: string;
  codeExpiresAt?: string;
  rotationHours: number;
  tokenPrice: number | null;
  effectiveTokenPrice: number;
}

export interface ServerIconAccessDTO {
  iconId: string;
  isUnlocked: boolean;
  accessType: 'purchased' | 'code' | 'locked';
  purchasedAt?: string;
  codeAccessExpiresAt?: string;
  codeExpiresAt?: string;
  rotationHours: number;
  tokenPrice: number | null;
  effectiveTokenPrice: number;
}

export interface FollowingAccountDTO {
  uid: string;
  displayName: string;
  isVerified: boolean;
  followersCount: number;
  publishedBooksCount: number;
}

export interface PublicUserProfileDTO {
  uid: string;
  displayName: string;
  isVerified: boolean;
  tokensBalance: number;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  publishedBookIds: string[];
  completedBookIds: string[];
  inProgressCount: number;
  totalBookmarks: number;
  unlockedPremiumBookIds: string[];
  unlockedPremiumThemeIds: string[];
  purchasedIds: string[];
  premiumAccessMeta: Record<string, { accessType: 'purchased' | 'code'; expiresAt?: string }>;
}

export interface PendingPriceRequestDTO {
  bookId: string;
  title: string;
  coverUrl: string;
  author: string;
  authorUid: string | null;
  isAuthorVerified: boolean;
  currentTokenPrice: number | null;
  effectiveCurrentPrice: number;
  proposedTokenPrice: number;
  submittedAt: string | null;
}

export interface UserNotificationDTO {
  id: string;
  type: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  targetBookId: string | null;
  targetUserUid: string | null;
  targetView: string | null;
  targetSection: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ServerCatalogResponse {
  catalogVersion: number;
  lastSyncedAt: string;
  sections: string[];
  sectionTranslations: Record<string, string>;
  books: ServerBookDTO[];
  themeAccess: Record<string, ServerThemeAccessDTO>;
  iconAccess: Record<string, ServerIconAccessDTO>;
  unlockedIds: string[];
  purchasedIds: string[];
  progressMap: Record<
    string,
    {
      bookId: string;
      chapterIndex: number;
      scrollRatio: number;
      bookmarks: number[];
      lastReadAt: string;
    }
  >;
  currentUserAccount?: {
    uid: string;
    email: string;
    displayName: string;
    isVerified: boolean;
    tokensBalance: number;
    activeIconId?: string | null;
    createdAt: string;
    followersCount: number;
    followingCount: number;
  } | null;
  economyConfig: TokenEconomyConfig;
  tokenTransactions?: TokenTransactionDTO[];
  followingAccounts: FollowingAccountDTO[];
  notifications?: UserNotificationDTO[];
  unreadNotificationsCount?: number;
  tradeRequests?: PremiumTradeRequestDTO[];
}

export interface DevCodeEntryDTO {
  targetType: 'book' | 'theme' | 'icon';
  targetId: string;
  label: string;
  rotatingCode: string;
  codeRotatedAt: string;
  codeExpiresAt: string;
  rotationHours: number;
  priceLabel?: string;
  tokenPrice?: number | null;
  effectiveTokenPrice?: number;
}

const SINGLE_USE_GRANT_FAR_FUTURE_MS = 100 * 365 * 24 * 3600_000;
const ECONOMY_CONFIG_META_KEY = 'token_economy_config_v1';

function clampEconomyInt(val: unknown, fallback: number): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(1_000_000, Math.max(0, Math.floor(num)));
}

function normalizeEconomyConfig(raw: unknown): TokenEconomyConfig {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    welcomeBonusTokens: clampEconomyInt(
      obj.welcomeBonusTokens,
      DEFAULT_TOKEN_ECONOMY_CONFIG.welcomeBonusTokens
    ),
    defaultPremiumBookPrice: clampEconomyInt(
      obj.defaultPremiumBookPrice,
      DEFAULT_TOKEN_ECONOMY_CONFIG.defaultPremiumBookPrice
    ),
    defaultPremiumThemePrice: clampEconomyInt(
      obj.defaultPremiumThemePrice,
      DEFAULT_TOKEN_ECONOMY_CONFIG.defaultPremiumThemePrice
    ),
    defaultPremiumIconPrice: clampEconomyInt(
      obj.defaultPremiumIconPrice,
      DEFAULT_TOKEN_ECONOMY_CONFIG.defaultPremiumIconPrice
    ),
    publishRegularBookCost: clampEconomyInt(
      obj.publishRegularBookCost,
      DEFAULT_TOKEN_ECONOMY_CONFIG.publishRegularBookCost
    ),
    publishPremiumBookCost: clampEconomyInt(
      obj.publishPremiumBookCost,
      DEFAULT_TOKEN_ECONOMY_CONFIG.publishPremiumBookCost
    ),
    rewardCommentOnBook: clampEconomyInt(
      obj.rewardCommentOnBook,
      DEFAULT_TOKEN_ECONOMY_CONFIG.rewardCommentOnBook
    ),
    rewardBookRatingAbove4: clampEconomyInt(
      obj.rewardBookRatingAbove4,
      DEFAULT_TOKEN_ECONOMY_CONFIG.rewardBookRatingAbove4
    ),
    rewardBookCompleted: clampEconomyInt(
      obj.rewardBookCompleted,
      DEFAULT_TOKEN_ECONOMY_CONFIG.rewardBookCompleted
    ),
    rewardNewFollower: clampEconomyInt(
      obj.rewardNewFollower,
      DEFAULT_TOKEN_ECONOMY_CONFIG.rewardNewFollower
    ),
    rewardReviewLike: clampEconomyInt(
      obj.rewardReviewLike,
      DEFAULT_TOKEN_ECONOMY_CONFIG.rewardReviewLike
    ),
    rewardBookApproved: clampEconomyInt(
      obj.rewardBookApproved,
      DEFAULT_TOKEN_ECONOMY_CONFIG.rewardBookApproved
    ),
  };
}

export async function getTokenEconomyConfig(): Promise<TokenEconomyConfig> {
  try {
    const [row] = await db
      .select()
      .from(catalogMeta)
      .where(eq(catalogMeta.key, ECONOMY_CONFIG_META_KEY))
      .limit(1);
    return normalizeEconomyConfig(row?.valueJson);
  } catch (error) {
    console.error('Database error in getTokenEconomyConfig:', error);
    return { ...DEFAULT_TOKEN_ECONOMY_CONFIG };
  }
}

export async function devUpdateTokenEconomyConfig(
  partial: Partial<TokenEconomyConfig>
): Promise<TokenEconomyConfig> {
  try {
    const current = await getTokenEconomyConfig();
    const merged = normalizeEconomyConfig({ ...current, ...partial });
    await db
      .insert(catalogMeta)
      .values({
        key: ECONOMY_CONFIG_META_KEY,
        valueJson: merged as unknown as Record<string, unknown>,
      })
      .onConflictDoUpdate({
        target: catalogMeta.key,
        set: { valueJson: merged as unknown as Record<string, unknown> },
      });
    await bumpCatalogVersion();
    return merged;
  } catch (error) {
    console.error('Database error in devUpdateTokenEconomyConfig:', error);
    throw new Error('Failed to update token economy configuration.', { cause: error });
  }
}

function getBookSalePricing(
  book: {
    isPremium?: boolean | null;
    tokenPrice?: number | null;
    discountPercent?: number | null;
    discountStartedAt?: Date | string | null;
    discountEndsAt?: Date | string | null;
    discountPostReleaseDays?: number | null;
  },
  economy: TokenEconomyConfig,
  nowMs = Date.now()
): {
  baseTokenPrice: number;
  effectiveTokenPrice: number;
  discountPercent: number | null;
  discountStartedAt: string | null;
  discountEndsAt: string | null;
  discountPostReleaseDays: number | null;
} {
  if (!book.isPremium) {
    return {
      baseTokenPrice: 0,
      effectiveTokenPrice: 0,
      discountPercent: null,
      discountStartedAt: null,
      discountEndsAt: null,
      discountPostReleaseDays: null,
    };
  }
  const baseTokenPrice =
    typeof book.tokenPrice === 'number' && Number.isFinite(book.tokenPrice) && book.tokenPrice >= 0
      ? Math.floor(book.tokenPrice)
      : economy.defaultPremiumBookPrice;

  const rawEnd = book.discountEndsAt ?? null;
  const endMs =
    rawEnd instanceof Date
      ? rawEnd.getTime()
      : typeof rawEnd === 'string' && rawEnd.trim()
        ? Date.parse(rawEnd)
        : null;
  const isNotExpired = endMs === null || (Number.isFinite(endMs) && endMs > nowMs);
  const rawPct =
    typeof book.discountPercent === 'number' && Number.isFinite(book.discountPercent)
      ? Math.floor(book.discountPercent)
      : null;
  const isDiscountActive = rawPct !== null && rawPct >= 1 && rawPct <= 99 && isNotExpired;

  if (!isDiscountActive || rawPct === null) {
    return {
      baseTokenPrice,
      effectiveTokenPrice: baseTokenPrice,
      discountPercent: null,
      discountStartedAt: null,
      discountEndsAt: null,
      discountPostReleaseDays: null,
    };
  }

  const effectiveTokenPrice = Math.max(0, Math.round(baseTokenPrice * (1 - rawPct / 100)));
  const startIso =
    book.discountStartedAt instanceof Date
      ? book.discountStartedAt.toISOString()
      : typeof book.discountStartedAt === 'string' && book.discountStartedAt.trim()
        ? book.discountStartedAt
        : null;
  const endIso =
    rawEnd instanceof Date
      ? rawEnd.toISOString()
      : typeof rawEnd === 'string' && rawEnd.trim()
        ? rawEnd
        : null;
  const cleanPostDays =
    typeof book.discountPostReleaseDays === 'number' &&
    Number.isFinite(book.discountPostReleaseDays) &&
    book.discountPostReleaseDays >= 1
      ? Math.floor(book.discountPostReleaseDays)
      : null;

  return {
    baseTokenPrice,
    effectiveTokenPrice,
    discountPercent: rawPct,
    discountStartedAt: startIso,
    discountEndsAt: endIso,
    discountPostReleaseDays: cleanPostDays,
  };
}

function resolveEffectiveBookTokenPrice(
  book: {
    isPremium?: boolean | null;
    tokenPrice?: number | null;
    discountPercent?: number | null;
    discountStartedAt?: Date | string | null;
    discountEndsAt?: Date | string | null;
    discountPostReleaseDays?: number | null;
  },
  economy: TokenEconomyConfig
): number {
  return getBookSalePricing(book, economy).effectiveTokenPrice;
}

function resolveEffectiveThemeTokenPrice(
  theme: { tokenPrice?: number | null } | undefined,
  economy: TokenEconomyConfig
): number {
  if (
    theme &&
    typeof theme.tokenPrice === 'number' &&
    Number.isFinite(theme.tokenPrice) &&
    theme.tokenPrice >= 0
  ) {
    return Math.floor(theme.tokenPrice);
  }
  return economy.defaultPremiumThemePrice;
}

function resolveEffectiveIconTokenPrice(
  icon: { tokenPrice?: number | null } | undefined,
  economy: TokenEconomyConfig
): number {
  if (
    icon &&
    typeof icon.tokenPrice === 'number' &&
    Number.isFinite(icon.tokenPrice) &&
    icon.tokenPrice >= 0
  ) {
    return Math.floor(icon.tokenPrice);
  }
  return economy.defaultPremiumIconPrice;
}

async function creditUserTokens(params: {
  userUid: string;
  amount: number;
  kind: string;
  descriptionAr: string;
  descriptionEn: string;
  targetBookId?: string | null;
  targetThemeId?: string | null;
  dedupeKey?: string | null;
}): Promise<{ credited: boolean; newBalance: number }> {
  const cleanAmount = Math.max(0, Math.floor(params.amount));
  if (cleanAmount <= 0) {
    const [u] = await db
      .select({ tokensBalance: users.tokensBalance })
      .from(users)
      .where(eq(users.uid, params.userUid))
      .limit(1);
    return { credited: false, newBalance: u?.tokensBalance ?? 0 };
  }

  return db.transaction(async (tx) => {
    const txId = `tok-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const inserted = await tx
      .insert(tokenTransactions)
      .values({
        id: txId,
        userUid: params.userUid,
        amount: cleanAmount,
        kind: params.kind,
        descriptionAr: params.descriptionAr,
        descriptionEn: params.descriptionEn,
        targetBookId: params.targetBookId ?? null,
        targetThemeId: params.targetThemeId ?? null,
        dedupeKey: params.dedupeKey ?? null,
      })
      .onConflictDoNothing()
      .returning({ id: tokenTransactions.id });

    if (inserted.length === 0) {
      const [u] = await tx
        .select({ tokensBalance: users.tokensBalance })
        .from(users)
        .where(eq(users.uid, params.userUid))
        .limit(1);
      return { credited: false, newBalance: u?.tokensBalance ?? 0 };
    }

    const updated = await tx
      .update(users)
      .set({
        tokensBalance: sql`${users.tokensBalance} + ${cleanAmount}`,
      })
      .where(eq(users.uid, params.userUid))
      .returning({ tokensBalance: users.tokensBalance });

    return { credited: true, newBalance: updated[0]?.tokensBalance ?? 0 };
  });
}

async function debitUserTokens(params: {
  userUid: string;
  amount: number;
  kind: string;
  descriptionAr: string;
  descriptionEn: string;
  targetBookId?: string | null;
  targetThemeId?: string | null;
}): Promise<{ ok: boolean; error?: string; newBalance: number }> {
  const cost = Math.max(0, Math.floor(params.amount));
  if (cost === 0) {
    const [u] = await db
      .select({ tokensBalance: users.tokensBalance })
      .from(users)
      .where(eq(users.uid, params.userUid))
      .limit(1);
    return { ok: true, newBalance: u?.tokensBalance ?? 0 };
  }

  return db.transaction(async (tx) => {
    const updated = await tx
      .update(users)
      .set({
        tokensBalance: sql`${users.tokensBalance} - ${cost}`,
      })
      .where(and(eq(users.uid, params.userUid), gte(users.tokensBalance, cost)))
      .returning({ tokensBalance: users.tokensBalance });

    if (updated.length === 0) {
      const [u] = await tx
        .select({ tokensBalance: users.tokensBalance })
        .from(users)
        .where(eq(users.uid, params.userUid))
        .limit(1);
      return {
        ok: false,
        error: `رصيد العملات الذهبية غير كافٍ (المطلوب: ${cost}، المتاح: ${u?.tokensBalance ?? 0}).`,
        newBalance: u?.tokensBalance ?? 0,
      };
    }

    const txId = `tok-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await tx.insert(tokenTransactions).values({
      id: txId,
      userUid: params.userUid,
      amount: -cost,
      kind: params.kind,
      descriptionAr: params.descriptionAr,
      descriptionEn: params.descriptionEn,
      targetBookId: params.targetBookId ?? null,
      targetThemeId: params.targetThemeId ?? null,
      dedupeKey: null,
    });

    return { ok: true, newBalance: updated[0].tokensBalance };
  });
}

function generateUniqueTenDigitCode(taken: Set<string>): string {
  for (let attempt = 0; attempt < 80; attempt++) {
    const first = Math.floor(1 + Math.random() * 9);
    let rest = '';
    for (let i = 0; i < 9; i++) {
      rest += Math.floor(Math.random() * 10).toString();
    }
    const code = `${first}${rest}`;
    if (!taken.has(code)) {
      taken.add(code);
      return code;
    }
  }
  const fallback = String(Date.now()).slice(-10).padStart(10, '1');
  taken.add(fallback);
  return fallback;
}

async function getTakenCodesSet(excludeTargetId?: string): Promise<Set<string>> {
  const [allBooks, allThemes, allIcons] = await Promise.all([
    db.select({ id: books.id, rotatingCode: books.rotatingCode }).from(books),
    db.select({ id: premiumThemes.id, rotatingCode: premiumThemes.rotatingCode }).from(premiumThemes),
    db.select({ id: premiumIcons.id, rotatingCode: premiumIcons.rotatingCode }).from(premiumIcons),
  ]);
  const taken = new Set<string>();
  for (const b of allBooks) {
    if (b.id !== excludeTargetId && b.rotatingCode) taken.add(b.rotatingCode);
  }
  for (const t of allThemes) {
    if (t.id !== excludeTargetId && t.rotatingCode) taken.add(t.rotatingCode);
  }
  for (const ic of allIcons) {
    if (ic.id !== excludeTargetId && ic.rotatingCode) taken.add(ic.rotatingCode);
  }
  return taken;
}

export async function getOrCreateUser(uid: string, email: string, displayName: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName,
        },
      })
      .returning();
    const userRow = result[0];
    if (userRow) {
      const economy = await getTokenEconomyConfig();
      if (economy.welcomeBonusTokens > 0) {
        const bonusRes = await creditUserTokens({
          userUid: uid,
          amount: economy.welcomeBonusTokens,
          kind: 'welcome_bonus',
          descriptionAr: 'مكافأة الترحيب بحسابك الجديد',
          descriptionEn: 'Welcome bonus for your new account',
          dedupeKey: `welcome:${uid}`,
        });
        if (bonusRes.credited) {
          userRow.tokensBalance = bonusRes.newBalance;
        }
      }
    }
    return userRow;
  } catch (error) {
    console.error('Database error in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user account.', { cause: error });
  }
}

export async function ensureCatalogSeeded(): Promise<void> {
  try {
    const existingThemeRows = await db.select({ id: premiumThemes.id }).from(premiumThemes);
    const existingThemeIds = new Set(existingThemeRows.map((t) => t.id));
    if (INITIAL_PREMIUM_THEME_CODES.some((t) => !existingThemeIds.has(t.id))) {
      const seedNow = new Date();
      for (const t of INITIAL_PREMIUM_THEME_CODES) {
        if (!existingThemeIds.has(t.id)) {
          await db
            .insert(premiumThemes)
            .values({
              id: t.id,
              rotatingCode: t.initialCode,
              codeRotatedAt: seedNow,
              codeExpiresAt: new Date(seedNow.getTime() + 24 * 3600_000),
              rotationHours: 24,
            })
            .onConflictDoNothing();
        }
      }
    }

    const existingIconRows = await db.select({ id: premiumIcons.id }).from(premiumIcons);
    const existingIconIds = new Set(existingIconRows.map((ic) => ic.id));
    if (PREMIUM_APP_ICONS.some((ic) => !existingIconIds.has(ic.id))) {
      const seedNow = new Date();
      for (const ic of PREMIUM_APP_ICONS) {
        if (!existingIconIds.has(ic.id) && ic.unlockCode) {
          await db
            .insert(premiumIcons)
            .values({
              id: ic.id,
              rotatingCode: ic.unlockCode,
              codeRotatedAt: seedNow,
              codeExpiresAt: new Date(seedNow.getTime() + 24 * 3600_000),
              rotationHours: 24,
            })
            .onConflictDoNothing();
        }
      }
    }

    const [existingMeta] = await db
      .select()
      .from(catalogMeta)
      .where(eq(catalogMeta.key, 'seeded_v1'));

    if (existingMeta) {
      return;
    }

    const existingSections = await db.select({ name: librarySections.name }).from(librarySections).limit(1);
    const now = new Date();

    if (existingSections.length === 0) {
      for (const sec of INITIAL_SECTIONS) {
        await db
          .insert(librarySections)
          .values({
            name: sec.name,
            englishName: sec.englishName,
            sortOrder: sec.sortOrder,
          })
          .onConflictDoNothing();
      }
    }

    for (const b of INITIAL_BOOKS) {
      const expiresAt = b.isPremium
        ? new Date(now.getTime() + b.rotationHours * 3600_000)
        : null;
      await db
        .insert(books)
        .values({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          author: b.author,
          category: b.category,
          year: b.year,
          pages: b.pages,
          readingMinutes: b.readingMinutes,
          rating: b.rating,
          version: b.version,
          updatedAt: b.updatedAt,
          addedAt: b.addedAt,
          featured: b.featured,
          isPremium: b.isPremium,
          priceLabel: b.priceLabel,
          rotatingCode: b.rotatingCode,
          codeRotatedAt: b.isPremium ? now : null,
          codeExpiresAt: expiresAt,
          rotationHours: b.rotationHours,
          bookType: b.bookType,
          pdfId: b.pdfId,
          pdfPageCount: b.pdfPageCount,
          coverUrl: b.coverUrl,
          synopsis: b.synopsis,
          chaptersJson: b.chapters,
        })
        .onConflictDoNothing();
    }

    for (const t of INITIAL_PREMIUM_THEME_CODES) {
      await db
        .insert(premiumThemes)
        .values({
          id: t.id,
          rotatingCode: t.initialCode,
          codeRotatedAt: now,
          codeExpiresAt: new Date(now.getTime() + 24 * 3600_000),
          rotationHours: 24,
        })
        .onConflictDoNothing();
    }

    await db
      .insert(catalogMeta)
      .values({
        key: 'catalog_version',
        valueJson: { version: 2026112101 },
      })
      .onConflictDoNothing();

    await db
      .insert(catalogMeta)
      .values({
        key: 'seeded_v1',
        valueJson: { seededAt: now.toISOString() },
      })
      .onConflictDoNothing();
  } catch (error) {
    console.error('Database error in ensureCatalogSeeded:', error);
    throw new Error('Failed to initialize library catalog.', { cause: error });
  }
}

async function bumpCatalogVersion(): Promise<number> {
  const [row] = await db
    .select()
    .from(catalogMeta)
    .where(eq(catalogMeta.key, 'catalog_version'));
  const current =
    row && typeof row.valueJson?.version === 'number' ? row.valueJson.version : 2026112101;
  const next = current + 1;
  await db
    .insert(catalogMeta)
    .values({ key: 'catalog_version', valueJson: { version: next } })
    .onConflictDoUpdate({
      target: catalogMeta.key,
      set: { valueJson: { version: next } },
    });
  return next;
}

export async function refreshExpiredRotatingCodes(): Promise<void> {
  try {
    const now = new Date();
    const farFuture = new Date(now.getTime() + SINGLE_USE_GRANT_FAR_FUTURE_MS);
    const [premiumBooksRows, themeRows, iconRows] = await Promise.all([
      db.select().from(books).where(eq(books.isPremium, true)),
      db.select().from(premiumThemes),
      db.select().from(premiumIcons),
    ]);

    const taken = await getTakenCodesSet();
    let rotatedAny = false;

    for (const b of premiumBooksRows) {
      if (!b.rotatingCode) {
        const newCode = generateUniqueTenDigitCode(taken);
        await db
          .update(books)
          .set({
            rotatingCode: newCode,
            codeRotatedAt: now,
            codeExpiresAt: farFuture,
          })
          .where(eq(books.id, b.id));
        rotatedAny = true;
      }
    }

    for (const t of themeRows) {
      if (!t.rotatingCode) {
        const newCode = generateUniqueTenDigitCode(taken);
        await db
          .update(premiumThemes)
          .set({
            rotatingCode: newCode,
            codeRotatedAt: now,
            codeExpiresAt: farFuture,
          })
          .where(eq(premiumThemes.id, t.id));
        rotatedAny = true;
      }
    }

    for (const ic of iconRows) {
      if (!ic.rotatingCode) {
        const newCode = generateUniqueTenDigitCode(taken);
        await db
          .update(premiumIcons)
          .set({
            rotatingCode: newCode,
            codeRotatedAt: now,
            codeExpiresAt: farFuture,
          })
          .where(eq(premiumIcons.id, ic.id));
        rotatedAny = true;
      }
    }

    if (rotatedAny) {
      await bumpCatalogVersion();
    }
  } catch (error) {
    console.error('Database error in refreshExpiredRotatingCodes:', error);
    throw new Error('Failed to refresh rotating access codes.', { cause: error });
  }
}

function hasServerBookContent(
  bookType: string | null | undefined,
  pdfId: string | null | undefined,
  chapters: ChapterRow[] | null | undefined,
  hasDocPayload = false
): boolean {
  if (bookType === 'pdf' || bookType === 'word') {
    return Boolean(pdfId?.trim() || hasDocPayload);
  }
  return (
    Array.isArray(chapters) &&
    chapters.some(
      (ch) =>
        Array.isArray(ch.paragraphs) && ch.paragraphs.some((p) => String(p).trim().length > 0)
    )
  );
}

function validateReleaseContentRequirement(
  isComingSoon: boolean,
  comingSoonMode: 'open' | 'date' | 'datetime' | null,
  comingSoonReleaseAt: string | null,
  bookType: string | null | undefined,
  pdfId: string | null | undefined,
  chapters: ChapterRow[] | null | undefined,
  hasDocPayload = false
): string | null {
  const isDocType = bookType === 'pdf' || bookType === 'word';
  const hasContent = hasServerBookContent(bookType, pdfId, chapters, hasDocPayload);

  if (isComingSoon) {
    if (comingSoonMode === 'date' || comingSoonMode === 'datetime') {
      if (!comingSoonReleaseAt) {
        return 'Please specify a release date or time, or switch Coming Soon to Open mode.';
      }
      if (!hasContent) {
        return isDocType
          ? 'A PDF or Word file is required when scheduling Coming Soon with a specific date or time.'
          : 'At least one chapter with content is required when scheduling Coming Soon with a specific date or time.';
      }
    }
    return null;
  }

  if (!hasContent) {
    return isDocType
      ? 'Please upload a PDF or Word file before publishing.'
      : 'Please write at least one chapter before publishing.';
  }
  return null;
}

function isScheduledReleaseDue(
  mode: string | null | undefined,
  rawReleaseAt: string | null | undefined,
  nowMs: number
): boolean {
  const raw = (rawReleaseAt ?? '').trim();
  if (!raw || (mode !== 'date' && mode !== 'datetime')) return false;
  if (mode === 'date') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (match) {
      const targetMs = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 0, 0, 0);
      return nowMs >= targetMs;
    }
  }
  const ts = Date.parse(raw);
  return Number.isFinite(ts) && nowMs >= ts;
}

async function handleBookLaunchedSideEffects(params: {
  bookId: string;
  title: string;
  authorUid: string | null;
  authorName: string;
  discountPercent?: number | null;
  discountPostReleaseDays?: number | null;
  discountEndsAt?: Date | string | null;
  now?: Date;
  notifyFollowers?: boolean;
}): Promise<void> {
  const now = params.now ?? new Date();
  const nowMs = now.getTime();

  const cleanPct =
    typeof params.discountPercent === 'number' && Number.isFinite(params.discountPercent)
      ? Math.floor(params.discountPercent)
      : null;
  const cleanPostDays =
    typeof params.discountPostReleaseDays === 'number' && Number.isFinite(params.discountPostReleaseDays)
      ? Math.floor(params.discountPostReleaseDays)
      : null;

  if (
    cleanPct !== null &&
    cleanPct >= 1 &&
    cleanPct <= 99 &&
    cleanPostDays !== null &&
    cleanPostDays >= 1 &&
    !params.discountEndsAt
  ) {
    const endsAt = new Date(nowMs + cleanPostDays * 24 * 60 * 60 * 1000);
    await db
      .update(books)
      .set({
        discountStartedAt: now,
        discountEndsAt: endsAt,
        discountPostReleaseDays: null,
      })
      .where(eq(books.id, params.bookId));
  } else if (cleanPostDays !== null) {
    await db
      .update(books)
      .set({ discountPostReleaseDays: null })
      .where(eq(books.id, params.bookId));
  }

  const pendingPreorders = await db
    .select()
    .from(bookPreorders)
    .where(and(eq(bookPreorders.bookId, params.bookId), eq(bookPreorders.status, 'pending')));

  const preorderedUids = new Set<string>();
  if (pendingPreorders.length > 0) {
    await db.transaction(async (tx) => {
      await tx
        .update(bookPreorders)
        .set({
          status: 'fulfilled',
          fulfilledAt: now,
        })
        .where(and(eq(bookPreorders.bookId, params.bookId), eq(bookPreorders.status, 'pending')));

      for (const po of pendingPreorders) {
        preorderedUids.add(po.userUid);
        await tx
          .insert(userBookPurchases)
          .values({
            userUid: po.userUid,
            bookId: params.bookId,
            grantedBy: 'preorder',
          })
          .onConflictDoNothing();
      }
    });

    for (const po of pendingPreorders) {
      await createUserNotification({
        userUid: po.userUid,
        type: 'preorder_fulfilled',
        titleAr: 'تم تسليم طلبك المسبق! كتابك جاهز للقراءة',
        titleEn: 'Your Pre-Order Is Ready to Read!',
        messageAr: `نُشر كتاب «${params.title}» للتو وتم فتحه في حسابك تلقائياً بناءً على طلبك المسبق دون أي رسوم إضافية.`,
        messageEn: `"${params.title}" just launched and has been automatically unlocked in your library from your pre-order!`,
        targetBookId: params.bookId,
        dedupeKey: `preorder_fulfilled:${params.bookId}:${po.userUid}:${nowMs}`,
      });
    }
  }

  const subscribers = await db
    .select({ userUid: comingSoonAlerts.userUid })
    .from(comingSoonAlerts)
    .where(eq(comingSoonAlerts.bookId, params.bookId));
  for (const sub of subscribers) {
    if (preorderedUids.has(sub.userUid)) continue;
    await createUserNotification({
      userUid: sub.userUid,
      type: 'coming_soon_launched',
      titleAr: 'تم نشر كتاب كنت تنتظره!',
      titleEn: 'A Book You Awaited Is Now Live!',
      messageAr: `نُشر للتو كتاب «${params.title}» وأصبح متاحاً للقراءة الآن.`,
      messageEn: `"${params.title}" has just been published and is now available to read!`,
      targetBookId: params.bookId,
      dedupeKey: `coming_soon_launched:${params.bookId}:${nowMs}`,
    });
  }
  await db.delete(comingSoonAlerts).where(eq(comingSoonAlerts.bookId, params.bookId));

  if (params.notifyFollowers && params.authorUid) {
    await notifyFollowersOfNewRelease(
      params.authorUid,
      params.authorName,
      params.bookId,
      params.title
    );
  }
}

async function autoReleaseDueComingSoonBooks(): Promise<void> {
  try {
    const now = new Date();
    const nowMs = now.getTime();
    const comingSoonRows = await db
      .select()
      .from(books)
      .where(and(eq(books.reviewStatus, 'approved'), eq(books.isComingSoon, true)));

    let launchedAny = false;
    for (const b of comingSoonRows) {
      if (!isScheduledReleaseDue(b.comingSoonMode, b.comingSoonReleaseAt, nowMs)) continue;
      if (!hasServerBookContent(b.bookType, b.pdfId, b.chaptersJson)) continue;

      await db
        .update(books)
        .set({
          isComingSoon: false,
          comingSoonMode: null,
          comingSoonReleaseAt: null,
          addedAt: now.toISOString(),
          updatedAt: now.toISOString().slice(0, 10),
        })
        .where(eq(books.id, b.id));

      let resolvedAuthorName = b.author;
      if (b.authorUid) {
        const [authorRow] = await db
          .select({ displayName: users.displayName })
          .from(users)
          .where(eq(users.uid, b.authorUid))
          .limit(1);
        if (authorRow?.displayName) {
          resolvedAuthorName = authorRow.displayName;
        }
      }

      await handleBookLaunchedSideEffects({
        bookId: b.id,
        title: b.title,
        authorUid: b.authorUid ?? null,
        authorName: resolvedAuthorName,
        discountPercent: b.discountPercent,
        discountPostReleaseDays: b.discountPostReleaseDays,
        discountEndsAt: b.discountEndsAt,
        now,
        notifyFollowers: Boolean(b.authorUid),
      });

      launchedAny = true;
    }

    if (launchedAny) {
      await bumpCatalogVersion();
    }
  } catch (error) {
    console.error('Database error in autoReleaseDueComingSoonBooks:', error);
  }
}

export async function getCatalogForUser(userUid: string | null): Promise<ServerCatalogResponse> {
  try {
    await ensureCatalogSeeded();
    await autoReleaseDueComingSoonBooks();
    await refreshExpiredRotatingCodes();
    if (userUid) {
      await syncFeatureAnnouncementsForUser(userUid);
    }

    const economyConfig = await getTokenEconomyConfig();
    const now = new Date();
    const [
      sectionRows,
      bookRows,
      reviewRows,
      reviewLikeRows,
      themeRows,
      iconRows,
      bookPurchases,
      themePurchases,
      iconPurchases,
      codeGrants,
      progressRows,
      versionRow,
      currentUserRows,
      allUsersRows,
      allFollowRows,
      notificationRows,
      comingSoonAlertRows,
      tradeRequestRows,
      tokenTxRows,
      pendingPreorderRows,
    ] = await Promise.all([
      db.select().from(librarySections).orderBy(asc(librarySections.sortOrder), asc(librarySections.id)),
      db.select().from(books).orderBy(desc(books.featured), desc(books.createdAt)),
      db.select().from(bookReviews).orderBy(desc(bookReviews.createdAt)),
      db.select().from(bookReviewLikes),
      db.select().from(premiumThemes),
      db.select().from(premiumIcons),
      userUid
        ? db.select().from(userBookPurchases).where(eq(userBookPurchases.userUid, userUid))
        : Promise.resolve([]),
      userUid
        ? db.select().from(userThemePurchases).where(eq(userThemePurchases.userUid, userUid))
        : Promise.resolve([]),
      userUid
        ? db.select().from(userIconPurchases).where(eq(userIconPurchases.userUid, userUid))
        : Promise.resolve([]),
      userUid
        ? db.select().from(userCodeGrants).where(eq(userCodeGrants.userUid, userUid))
        : Promise.resolve([]),
      userUid
        ? db.select().from(readingProgress).where(eq(readingProgress.userUid, userUid))
        : Promise.resolve([]),
      db.select().from(catalogMeta).where(eq(catalogMeta.key, 'catalog_version')),
      userUid
        ? db.select().from(users).where(eq(users.uid, userUid)).limit(1)
        : Promise.resolve([]),
      db
        .select({
          uid: users.uid,
          displayName: users.displayName,
          isVerified: users.isVerified,
        })
        .from(users),
      db.select().from(userFollows),
      userUid
        ? db
            .select()
            .from(userNotifications)
            .where(eq(userNotifications.userUid, userUid))
            .orderBy(desc(userNotifications.createdAt))
        : Promise.resolve([]),
      db.select().from(comingSoonAlerts),
      userUid
        ? db
            .select()
            .from(premiumTradeRequests)
            .where(
              or(
                eq(premiumTradeRequests.senderUid, userUid),
                eq(premiumTradeRequests.recipientUid, userUid)
              )
            )
            .orderBy(desc(premiumTradeRequests.createdAt))
        : Promise.resolve([]),
      userUid
        ? db
            .select()
            .from(tokenTransactions)
            .where(eq(tokenTransactions.userUid, userUid))
            .orderBy(desc(tokenTransactions.createdAt))
            .limit(50)
        : Promise.resolve([]),
      db
        .select({ bookId: bookPreorders.bookId, userUid: bookPreorders.userUid })
        .from(bookPreorders)
        .where(eq(bookPreorders.status, 'pending')),
    ]);

    const usersByUid = new Map(allUsersRows.map((u) => [u.uid, u]));
    const followersCountMap = new Map<string, number>();
    const followingCountMap = new Map<string, number>();
    const followingSet = new Set<string>();
    const publishedCountMap = new Map<string, number>();

    for (const f of allFollowRows) {
      followersCountMap.set(f.targetUid, (followersCountMap.get(f.targetUid) ?? 0) + 1);
      followingCountMap.set(f.followerUid, (followingCountMap.get(f.followerUid) ?? 0) + 1);
      if (userUid && f.followerUid === userUid) {
        followingSet.add(f.targetUid);
      }
    }

    const visibleBookRows = bookRows.filter(
      (b) => b.reviewStatus === 'approved' || (Boolean(userUid) && b.authorUid === userUid)
    );

    for (const b of bookRows) {
      if (b.authorUid && b.reviewStatus === 'approved') {
        publishedCountMap.set(b.authorUid, (publishedCountMap.get(b.authorUid) ?? 0) + 1);
      }
    }

    const reviewLikesCountMap = new Map<string, number>();
    const reviewsLikedByMeSet = new Set<string>();
    for (const like of reviewLikeRows) {
      reviewLikesCountMap.set(like.reviewId, (reviewLikesCountMap.get(like.reviewId) ?? 0) + 1);
      if (userUid && like.userUid === userUid) {
        reviewsLikedByMeSet.add(like.reviewId);
      }
    }

    const reviewsByBook = new Map<string, BookReviewDTO[]>();
    const myPendingReviewsByBook = new Map<string, BookReviewDTO>();
    for (const r of reviewRows) {
      const modStatus: 'pending' | 'approved' | 'rejected' =
        r.moderationStatus === 'pending' || r.moderationStatus === 'rejected'
          ? r.moderationStatus
          : 'approved';
      const linkedUser = r.reviewerUid ? usersByUid.get(r.reviewerUid) : undefined;
      const dto: BookReviewDTO = {
        id: r.id,
        bookId: r.bookId,
        reviewerUid: linkedUser ? linkedUser.uid : null,
        reviewerName: linkedUser ? linkedUser.displayName : r.reviewerName,
        rating: r.rating,
        comment: r.comment,
        isVerified: linkedUser
          ? Boolean(linkedUser.isVerified)
          : Boolean(r.isVerified || r.isOwner),
        isOwner: Boolean(r.isOwner),
        likesCount: reviewLikesCountMap.get(r.id) ?? 0,
        likedByMe: reviewsLikedByMeSet.has(r.id),
        moderationStatus: modStatus,
        moderationNote: r.moderationNote ?? null,
        createdAt: r.createdAt.toISOString(),
      };
      if (modStatus === 'approved') {
        const list = reviewsByBook.get(r.bookId) ?? [];
        list.push(dto);
        reviewsByBook.set(r.bookId, list);
      } else if (userUid && r.reviewerUid === userUid && !myPendingReviewsByBook.has(r.bookId)) {
        myPendingReviewsByBook.set(r.bookId, dto);
      }
    }

    const bookPurchaseMap = new Map(bookPurchases.map((p) => [p.bookId, p]));
    const themePurchaseMap = new Map(themePurchases.map((p) => [p.themeId, p]));
    const iconPurchaseMap = new Map(iconPurchases.map((p) => [p.iconId, p]));
    const grantMap = new Map(
      codeGrants.map((g) => [`${g.targetType}:${g.targetId}`, g])
    );
    const comingSoonSubscribersCountMap = new Map<string, number>();
    const myComingSoonAlertsSet = new Set<string>();
    for (const alert of comingSoonAlertRows) {
      comingSoonSubscribersCountMap.set(
        alert.bookId,
        (comingSoonSubscribersCountMap.get(alert.bookId) ?? 0) + 1
      );
      if (userUid && alert.userUid === userUid) {
        myComingSoonAlertsSet.add(alert.bookId);
      }
    }

    const preordersCountMap = new Map<string, number>();
    const myPreordersSet = new Set<string>();
    for (const po of pendingPreorderRows) {
      preordersCountMap.set(po.bookId, (preordersCountMap.get(po.bookId) ?? 0) + 1);
      if (userUid && po.userUid === userUid) {
        myPreordersSet.add(po.bookId);
      }
    }

    const unlockedIds: string[] = [];
    const purchasedIds: string[] = [];

    const sanitizedBooks: ServerBookDTO[] = visibleBookRows.map((b) => {
      const purchase = bookPurchaseMap.get(b.id);
      const grant = grantMap.get(`book:${b.id}`);
      const hasValidGrant = Boolean(grant);
      const isComingSoon = Boolean(b.isComingSoon);
      const isOwner = Boolean(userUid && b.authorUid === userUid);
      const reviewStatus: 'approved' | 'pending' | 'rejected' =
        b.reviewStatus === 'pending' || b.reviewStatus === 'rejected'
          ? b.reviewStatus
          : 'approved';

      let accessType: AccessType = 'free';
      let isUnlocked = true;
      let purchasedAt: string | undefined;

      if (b.isPremium) {
        if (purchase) {
          accessType = 'purchased';
          isUnlocked = true;
          purchasedAt = purchase.purchasedAt.toISOString();
          unlockedIds.push(b.id);
          purchasedIds.push(b.id);
        } else if (hasValidGrant) {
          accessType = 'code';
          isUnlocked = true;
          unlockedIds.push(b.id);
        } else {
          accessType = 'locked';
          isUnlocked = false;
        }
      }

      const bookReviewsList = reviewsByBook.get(b.id) ?? [];
      const computedRating =
        bookReviewsList.length > 0
          ? Math.min(
              5,
              Math.max(
                0,
                Math.round(
                  (bookReviewsList.reduce((acc, item) => acc + item.rating, 0) /
                    bookReviewsList.length) *
                    10
                ) / 10
              )
            )
          : 0;

      const linkedUser = b.authorUid ? usersByUid.get(b.authorUid) : undefined;
      const authorName = linkedUser ? linkedUser.displayName : b.author;
      const authorAccount: BookAuthorAccountDTO | null = linkedUser
        ? {
            uid: linkedUser.uid,
            displayName: linkedUser.displayName,
            isVerified: Boolean(linkedUser.isVerified),
            followersCount: followersCountMap.get(linkedUser.uid) ?? 0,
            isFollowing: followingSet.has(linkedUser.uid),
          }
        : null;

      const salePricing = getBookSalePricing(b, economyConfig, now.getTime());
      return {
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        author: authorName,
        authorUid: linkedUser ? linkedUser.uid : b.authorUid ?? null,
        authorAccount,
        isAuthorVerified: linkedUser
          ? Boolean(linkedUser.isVerified || b.isAuthorVerified)
          : Boolean(b.isAuthorVerified),
        category: b.category,
        year: b.year,
        pages: b.pages,
        readingMinutes: b.readingMinutes,
        rating: computedRating,
        reviews: bookReviewsList,
        myPendingReview: myPendingReviewsByBook.get(b.id) ?? null,
        version: b.version,
        updatedAt: b.updatedAt,
        addedAt: b.addedAt ?? undefined,
        featured: b.featured,
        isComingSoon,
        comingSoonMode:
          isComingSoon &&
          (b.comingSoonMode === 'date' || b.comingSoonMode === 'datetime' || b.comingSoonMode === 'open')
            ? b.comingSoonMode
            : isComingSoon
              ? 'open'
              : undefined,
        comingSoonReleaseAt:
          isComingSoon && b.comingSoonReleaseAt ? b.comingSoonReleaseAt : undefined,
        isNotifySubscribed: isComingSoon ? myComingSoonAlertsSet.has(b.id) : false,
        notifySubscribersCount: comingSoonSubscribersCountMap.get(b.id) ?? 0,
        isPreordered: isComingSoon ? myPreordersSet.has(b.id) : false,
        preordersCount: isComingSoon ? (preordersCountMap.get(b.id) ?? 0) : 0,
        isPremium: b.isPremium,
        priceLabel: b.priceLabel,
        tokenPrice: b.tokenPrice ?? null,
        baseTokenPrice: salePricing.baseTokenPrice,
        effectiveTokenPrice: salePricing.effectiveTokenPrice,
        discountPercent: salePricing.discountPercent,
        discountStartedAt: salePricing.discountStartedAt,
        discountEndsAt: salePricing.discountEndsAt,
        discountPostReleaseDays: salePricing.discountPostReleaseDays,
        pendingTokenPrice: isOwner ? b.pendingTokenPrice ?? null : null,
        priceReviewStatus:
          isOwner && (b.priceReviewStatus === 'pending' || b.priceReviewStatus === 'rejected')
            ? b.priceReviewStatus
            : null,
        priceReviewNote: isOwner ? b.priceReviewNote ?? null : null,
        priceSubmittedAt:
          isOwner && b.priceSubmittedAt ? b.priceSubmittedAt.toISOString() : null,
        publishTokensPaid: b.publishTokensPaid ?? 0,
        rotationHours: b.rotationHours,
        accessType,
        isUnlocked: isOwner && reviewStatus !== 'approved' ? true : isUnlocked,
        purchasedAt,
        bookType: (b.bookType as 'text' | 'pdf' | 'word') || 'text',
        pdfId: b.pdfId ?? undefined,
        pdfPageCount: b.pdfPageCount ?? undefined,
        coverUrl: b.coverUrl,
        synopsis: b.synopsis,
        // Never leak full premium chapters or coming-soon chapters (owners can preview their own pending drafts)
        chapters:
          (isUnlocked && !isComingSoon) || (isOwner && reviewStatus !== 'approved')
            ? b.chaptersJson
            : [],
        reviewStatus,
        reviewNote: b.reviewNote ?? null,
        submittedAt: b.submittedAt ? b.submittedAt.toISOString() : null,
        seriesId: b.seriesId ?? null,
        seriesTitle: b.seriesTitle ?? null,
        partNumber: b.partNumber ?? null,
      };
    });

    const themeAccess: Record<string, ServerThemeAccessDTO> = {};
    for (const t of themeRows) {
      const purchase = themePurchaseMap.get(t.id);
      const grant = grantMap.get(`theme:${t.id}`);
      const hasValidGrant = Boolean(grant);
      const themeTokenPrice = t.tokenPrice ?? null;
      const effectiveThemePrice = resolveEffectiveThemeTokenPrice(t, economyConfig);

      if (purchase) {
        themeAccess[t.id] = {
          themeId: t.id,
          isUnlocked: true,
          accessType: 'purchased',
          purchasedAt: purchase.purchasedAt.toISOString(),
          rotationHours: t.rotationHours,
          tokenPrice: themeTokenPrice,
          effectiveTokenPrice: effectiveThemePrice,
        };
        unlockedIds.push(t.id);
        purchasedIds.push(t.id);
      } else if (hasValidGrant) {
        themeAccess[t.id] = {
          themeId: t.id,
          isUnlocked: true,
          accessType: 'code',
          rotationHours: t.rotationHours,
          tokenPrice: themeTokenPrice,
          effectiveTokenPrice: effectiveThemePrice,
        };
        unlockedIds.push(t.id);
      } else {
        themeAccess[t.id] = {
          themeId: t.id,
          isUnlocked: false,
          accessType: 'locked',
          rotationHours: t.rotationHours,
          tokenPrice: themeTokenPrice,
          effectiveTokenPrice: effectiveThemePrice,
        };
      }
    }

    const iconAccess: Record<string, ServerIconAccessDTO> = {};
    for (const ic of iconRows) {
      const purchase = iconPurchaseMap.get(ic.id);
      const grant = grantMap.get(`icon:${ic.id}`);
      const hasValidGrant = Boolean(grant);
      const iconTokenPrice = ic.tokenPrice ?? null;
      const effectiveIconPrice = resolveEffectiveIconTokenPrice(ic, economyConfig);

      if (purchase) {
        iconAccess[ic.id] = {
          iconId: ic.id,
          isUnlocked: true,
          accessType: 'purchased',
          purchasedAt: purchase.purchasedAt.toISOString(),
          rotationHours: ic.rotationHours,
          tokenPrice: iconTokenPrice,
          effectiveTokenPrice: effectiveIconPrice,
        };
        unlockedIds.push(ic.id);
        purchasedIds.push(ic.id);
      } else if (hasValidGrant) {
        iconAccess[ic.id] = {
          iconId: ic.id,
          isUnlocked: true,
          accessType: 'code',
          rotationHours: ic.rotationHours,
          tokenPrice: iconTokenPrice,
          effectiveTokenPrice: effectiveIconPrice,
        };
        unlockedIds.push(ic.id);
      } else {
        iconAccess[ic.id] = {
          iconId: ic.id,
          isUnlocked: false,
          accessType: 'locked',
          rotationHours: ic.rotationHours,
          tokenPrice: iconTokenPrice,
          effectiveTokenPrice: effectiveIconPrice,
        };
      }
    }

    const sections = sectionRows.map((s) => s.name);
    const sectionTranslations: Record<string, string> = {};
    for (const s of sectionRows) {
      if (s.englishName?.trim()) {
        sectionTranslations[s.name] = s.englishName.trim();
      }
    }

    const progressMap: ServerCatalogResponse['progressMap'] = {};
    for (const p of progressRows) {
      progressMap[p.bookId] = {
        bookId: p.bookId,
        chapterIndex: p.chapterIndex,
        scrollRatio: p.scrollRatio,
        bookmarks: p.bookmarksJson ?? [],
        lastReadAt: p.lastReadAt,
      };
    }

    const catalogVersion =
      versionRow[0] && typeof versionRow[0].valueJson?.version === 'number'
        ? (versionRow[0].valueJson.version as number)
        : 2026112101;

    const currentUserRow = currentUserRows[0];
    const followingAccounts: FollowingAccountDTO[] = [];
    for (const targetUid of followingSet) {
      const targetUser = usersByUid.get(targetUid);
      if (targetUser) {
        followingAccounts.push({
          uid: targetUser.uid,
          displayName: targetUser.displayName,
          isVerified: Boolean(targetUser.isVerified),
          followersCount: followersCountMap.get(targetUser.uid) ?? 0,
          publishedBooksCount: publishedCountMap.get(targetUser.uid) ?? 0,
        });
      }
    }

    const mappedNotifications: UserNotificationDTO[] = notificationRows.map((n) => ({
      id: n.id,
      type: n.type,
      titleAr: n.titleAr,
      titleEn: n.titleEn,
      messageAr: n.messageAr,
      messageEn: n.messageEn,
      targetBookId: n.targetBookId ?? null,
      targetUserUid: n.targetUserUid ?? null,
      targetView: n.targetView ?? null,
      targetSection: n.targetSection ?? null,
      isRead: Boolean(n.isRead),
      createdAt: n.createdAt.toISOString(),
    }));

    const sanitizeDisplay = (raw: string | undefined): string => {
      const trimmed = (raw || '').trim();
      if (!trimmed) return 'Reader';
      const atIdx = trimmed.indexOf('@');
      return atIdx > 0 ? trimmed.slice(0, atIdx) : trimmed;
    };

    const mappedTradeRequests: PremiumTradeRequestDTO[] = tradeRequestRows.map((tr) => {
      const sender = usersByUid.get(tr.senderUid);
      const recipient = usersByUid.get(tr.recipientUid);
      return {
        id: tr.id,
        senderUid: tr.senderUid,
        senderDisplayName: sanitizeDisplay(sender?.displayName),
        senderIsVerified: Boolean(sender?.isVerified),
        recipientUid: tr.recipientUid,
        recipientDisplayName: sanitizeDisplay(recipient?.displayName),
        recipientIsVerified: Boolean(recipient?.isVerified),
        offeredType: tr.offeredType === 'theme' ? 'theme' : 'book',
        offeredId: tr.offeredId,
        requestedType: tr.requestedType === 'theme' ? 'theme' : 'book',
        requestedId: tr.requestedId,
        status:
          tr.status === 'accepted' || tr.status === 'declined' || tr.status === 'cancelled'
            ? tr.status
            : 'pending',
        respondedAt: tr.respondedAt ? tr.respondedAt.toISOString() : null,
        createdAt: tr.createdAt.toISOString(),
      };
    });

    const mappedTokenTransactions: TokenTransactionDTO[] = tokenTxRows.map((tx) => ({
      id: tx.id,
      amount: tx.amount,
      kind: tx.kind,
      descriptionAr: tx.descriptionAr,
      descriptionEn: tx.descriptionEn,
      targetBookId: tx.targetBookId ?? null,
      targetThemeId: tx.targetThemeId ?? null,
      createdAt: tx.createdAt.toISOString(),
    }));

    return {
      catalogVersion,
      lastSyncedAt: now.toISOString(),
      sections,
      sectionTranslations,
      books: sanitizedBooks,
      themeAccess,
      iconAccess,
      unlockedIds,
      purchasedIds,
      progressMap,
      currentUserAccount: currentUserRow
        ? {
            uid: currentUserRow.uid,
            email: currentUserRow.email,
            displayName: currentUserRow.displayName,
            isVerified: Boolean(currentUserRow.isVerified),
            tokensBalance: currentUserRow.tokensBalance ?? 0,
            activeIconId: currentUserRow.activeIconId ?? DEFAULT_APP_ICON_ID,
            createdAt: currentUserRow.createdAt.toISOString(),
            followersCount: followersCountMap.get(currentUserRow.uid) ?? 0,
            followingCount: followingCountMap.get(currentUserRow.uid) ?? 0,
          }
        : null,
      economyConfig,
      tokenTransactions: mappedTokenTransactions,
      followingAccounts,
      notifications: mappedNotifications,
      unreadNotificationsCount: mappedNotifications.filter((n) => !n.isRead).length,
      tradeRequests: mappedTradeRequests,
    };
  } catch (error) {
    console.error('Database error in getCatalogForUser:', error);
    throw new Error('Failed to load library catalog from database.', { cause: error });
  }
}

interface FeatureAnnouncementRecord {
  key: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  targetView: string;
  targetSection?: string | null;
  createdAt?: string;
}

const FEATURE_ANNOUNCEMENTS_META_KEY = 'feature_announcements_v1';

const BUILT_IN_FEATURE_ANNOUNCEMENTS: FeatureAnnouncementRecord[] = [
  {
    key: 'profile_book_publishing_v1',
    titleAr: 'ميزة جديدة: انشر كتابك بنفسك من ملفك الشخصي!',
    titleEn: 'New Feature: Publish Your Own Books from Your Profile!',
    messageAr:
      'أصبح بإمكانك الآن رفع وإرسال كتابك (نصي أو PDF أو Word أو قريباً) مباشرة من أسفل صفحة ملفك الشخصي لمراجعته ونشره لجميع القراء.',
    messageEn:
      'You can now upload and submit your own text, PDF, Word, or Coming Soon book directly from your Profile for review and publication.',
    targetView: 'you',
    targetSection: 'publish-studio',
  },
];

async function getAllFeatureAnnouncements(): Promise<FeatureAnnouncementRecord[]> {
  try {
    const [row] = await db
      .select()
      .from(catalogMeta)
      .where(eq(catalogMeta.key, FEATURE_ANNOUNCEMENTS_META_KEY))
      .limit(1);
    const storedRaw = (row?.valueJson as { items?: unknown } | undefined)?.items;
    const customItems: FeatureAnnouncementRecord[] = Array.isArray(storedRaw)
      ? storedRaw.filter(
          (item): item is FeatureAnnouncementRecord =>
            Boolean(item) &&
            typeof item === 'object' &&
            typeof (item as FeatureAnnouncementRecord).key === 'string' &&
            typeof (item as FeatureAnnouncementRecord).titleAr === 'string'
        )
      : [];
    const seenKeys = new Set<string>();
    const combined: FeatureAnnouncementRecord[] = [];
    for (const item of [...BUILT_IN_FEATURE_ANNOUNCEMENTS, ...customItems]) {
      if (seenKeys.has(item.key)) continue;
      seenKeys.add(item.key);
      combined.push(item);
    }
    return combined;
  } catch (error) {
    console.error('Non-fatal error loading feature announcements:', error);
    return BUILT_IN_FEATURE_ANNOUNCEMENTS;
  }
}

async function syncFeatureAnnouncementsForUser(userUid: string): Promise<void> {
  try {
    const announcements = await getAllFeatureAnnouncements();
    for (const item of announcements) {
      await createUserNotification({
        userUid,
        type: 'feature_announcement',
        titleAr: item.titleAr,
        titleEn: item.titleEn,
        messageAr: item.messageAr,
        messageEn: item.messageEn,
        targetView: item.targetView,
        targetSection: item.targetSection ?? null,
        dedupeKey: `feature:${item.key}`,
      });
    }
  } catch (error) {
    console.error('Non-fatal syncFeatureAnnouncementsForUser error:', error);
  }
}

export async function devBroadcastFeatureAnnouncement(input: {
  titleAr: string;
  titleEn?: string;
  messageAr: string;
  messageEn?: string;
  targetView: string;
  targetSection?: string | null;
}): Promise<{ ok: boolean; error?: string; recipientsCount?: number }> {
  try {
    const titleAr = (input.titleAr ?? '').trim();
    const titleEn = (input.titleEn ?? '').trim() || titleAr;
    const messageAr = (input.messageAr ?? '').trim();
    const messageEn = (input.messageEn ?? '').trim() || messageAr;
    if (!titleAr || !messageAr) {
      return { ok: false, error: 'Announcement title and message are required.' };
    }

    const allowedViews = new Set(['home', 'catalog', 'premium', 'reading', 'you', 'settings']);
    const targetView = allowedViews.has(input.targetView) ? input.targetView : 'you';
    const targetSection = input.targetSection?.trim() || null;

    const newRecord: FeatureAnnouncementRecord = {
      key: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      titleAr,
      titleEn,
      messageAr,
      messageEn,
      targetView,
      targetSection,
      createdAt: new Date().toISOString(),
    };

    const [existingMeta] = await db
      .select()
      .from(catalogMeta)
      .where(eq(catalogMeta.key, FEATURE_ANNOUNCEMENTS_META_KEY))
      .limit(1);
    const prevRaw = (existingMeta?.valueJson as { items?: unknown } | undefined)?.items;
    const prevItems = Array.isArray(prevRaw) ? (prevRaw as FeatureAnnouncementRecord[]) : [];
    const nextItems = [...prevItems, newRecord].slice(-20);

    await db
      .insert(catalogMeta)
      .values({
        key: FEATURE_ANNOUNCEMENTS_META_KEY,
        valueJson: { items: nextItems } as unknown as Record<string, unknown>,
      })
      .onConflictDoUpdate({
        target: catalogMeta.key,
        set: {
          valueJson: { items: nextItems } as unknown as Record<string, unknown>,
        },
      });

    const allUsers = await db.select({ uid: users.uid }).from(users);
    for (const u of allUsers) {
      await createUserNotification({
        userUid: u.uid,
        type: 'feature_announcement',
        titleAr: newRecord.titleAr,
        titleEn: newRecord.titleEn,
        messageAr: newRecord.messageAr,
        messageEn: newRecord.messageEn,
        targetView: newRecord.targetView,
        targetSection: newRecord.targetSection ?? null,
        dedupeKey: `feature:${newRecord.key}`,
      });
    }

    return { ok: true, recipientsCount: allUsers.length };
  } catch (error) {
    console.error('Database error in devBroadcastFeatureAnnouncement:', error);
    throw new Error('Failed to broadcast feature announcement.', { cause: error });
  }
}

async function createUserNotification(input: {
  userUid: string;
  type: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  targetBookId?: string | null;
  targetUserUid?: string | null;
  targetView?: string | null;
  targetSection?: string | null;
  dedupeKey?: string | null;
}): Promise<void> {
  try {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await db
      .insert(userNotifications)
      .values({
        id,
        userUid: input.userUid,
        type: input.type,
        titleAr: input.titleAr,
        titleEn: input.titleEn,
        messageAr: input.messageAr,
        messageEn: input.messageEn,
        targetBookId: input.targetBookId ?? null,
        targetUserUid: input.targetUserUid ?? null,
        targetView: input.targetView ?? null,
        targetSection: input.targetSection ?? null,
        dedupeKey: input.dedupeKey ?? null,
      })
      .onConflictDoNothing();
  } catch (error) {
    console.error('Non-fatal notification insert error:', error);
  }
}

export async function getUserNotifications(userUid: string): Promise<{
  notifications: UserNotificationDTO[];
  unreadCount: number;
}> {
  try {
    await syncFeatureAnnouncementsForUser(userUid);
    const rows = await db
      .select()
      .from(userNotifications)
      .where(eq(userNotifications.userUid, userUid))
      .orderBy(desc(userNotifications.createdAt));

    const notifications: UserNotificationDTO[] = rows.map((n) => ({
      id: n.id,
      type: n.type,
      titleAr: n.titleAr,
      titleEn: n.titleEn,
      messageAr: n.messageAr,
      messageEn: n.messageEn,
      targetBookId: n.targetBookId ?? null,
      targetUserUid: n.targetUserUid ?? null,
      targetView: n.targetView ?? null,
      targetSection: n.targetSection ?? null,
      isRead: Boolean(n.isRead),
      createdAt: n.createdAt.toISOString(),
    }));
    return {
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    };
  } catch (error) {
    console.error('Database error in getUserNotifications:', error);
    throw new Error('Failed to load notifications.', { cause: error });
  }
}

export async function markNotificationRead(userUid: string, notificationId: string): Promise<void> {
  await db
    .update(userNotifications)
    .set({ isRead: true })
    .where(and(eq(userNotifications.id, notificationId), eq(userNotifications.userUid, userUid)));
}

export async function markAllNotificationsRead(userUid: string): Promise<void> {
  await db
    .update(userNotifications)
    .set({ isRead: true })
    .where(eq(userNotifications.userUid, userUid));
}

export async function deleteUserNotification(
  userUid: string,
  notificationId: string
): Promise<void> {
  await db
    .delete(userNotifications)
    .where(and(eq(userNotifications.id, notificationId), eq(userNotifications.userUid, userUid)));
}

export async function clearAllUserNotifications(userUid: string): Promise<void> {
  await db.delete(userNotifications).where(eq(userNotifications.userUid, userUid));
}

export async function purchaseBookForUser(
  userUid: string,
  bookId: string,
  grantedBy = 'checkout'
): Promise<{ ok: boolean; bookTitle?: string }> {
  try {
    const [book] = await db.select().from(books).where(eq(books.id, bookId));
    if (!book) {
      return { ok: false };
    }
    const [existingPurchase] = await db
      .select({ id: userBookPurchases.id })
      .from(userBookPurchases)
      .where(and(eq(userBookPurchases.userUid, userUid), eq(userBookPurchases.bookId, bookId)))
      .limit(1);

    await db
      .insert(userBookPurchases)
      .values({
        userUid,
        bookId,
        grantedBy,
      })
      .onConflictDoNothing();

    if (!existingPurchase) {
      await createUserNotification({
        userUid,
        type: 'premium',
        titleAr: 'تمت إضافة كتاب بريميوم لحسابك',
        titleEn: 'Premium Book Added',
        messageAr: `تم فتح الوصول الدائم لكتاب «${book.title}» وإضافته إلى مقتنياتك البريميوم.`,
        messageEn: `Permanent access to "${book.title}" has been added to your premium collection.`,
        targetBookId: book.id,
        dedupeKey: `premium_book_perm:${book.id}`,
      });
    }
    return { ok: true, bookTitle: book.title };
  } catch (error) {
    console.error('Database error in purchaseBookForUser:', error);
    throw new Error('Failed to complete permanent book purchase.', { cause: error });
  }
}

export async function purchaseThemeForUser(
  userUid: string,
  themeId: string,
  grantedBy = 'checkout'
): Promise<{ ok: boolean }> {
  try {
    const [theme] = await db.select().from(premiumThemes).where(eq(premiumThemes.id, themeId));
    if (!theme) {
      return { ok: false };
    }
    const [existingPurchase] = await db
      .select({ id: userThemePurchases.id })
      .from(userThemePurchases)
      .where(and(eq(userThemePurchases.userUid, userUid), eq(userThemePurchases.themeId, themeId)))
      .limit(1);

    await db
      .insert(userThemePurchases)
      .values({
        userUid,
        themeId,
        grantedBy,
      })
      .onConflictDoNothing();

    if (!existingPurchase) {
      const themeDef = THEME_CATALOG.find((t) => t.id === themeId);
      const themeAr = themeDef?.name ?? themeId;
      const themeEn = themeDef?.nameEn ?? themeId;
      await createUserNotification({
        userUid,
        type: 'premium',
        titleAr: 'تمت إضافة سمة بريميوم لحسابك',
        titleEn: 'Premium Theme Added',
        messageAr: `تم فتح السمة الملكية «${themeAr}» وإضافتها إلى مقتنياتك الدائمة.`,
        messageEn: `Premium theme "${themeEn}" has been permanently unlocked for your account.`,
        dedupeKey: `premium_theme_perm:${themeId}`,
      });
    }
    return { ok: true };
  } catch (error) {
    console.error('Database error in purchaseThemeForUser:', error);
    throw new Error('Failed to unlock permanent theme access.', { cause: error });
  }
}

export async function purchaseIconForUser(
  userUid: string,
  iconId: string,
  grantedBy = 'checkout'
): Promise<{ ok: boolean }> {
  try {
    const [iconRow] = await db.select().from(premiumIcons).where(eq(premiumIcons.id, iconId));
    if (!iconRow) {
      return { ok: false };
    }
    const [existingPurchase] = await db
      .select({ id: userIconPurchases.id })
      .from(userIconPurchases)
      .where(and(eq(userIconPurchases.userUid, userUid), eq(userIconPurchases.iconId, iconId)))
      .limit(1);

    await db
      .insert(userIconPurchases)
      .values({
        userUid,
        iconId,
        grantedBy,
      })
      .onConflictDoNothing();

    if (!existingPurchase) {
      const iconDef = getAppIconById(iconId);
      await createUserNotification({
        userUid,
        type: 'premium',
        titleAr: 'تمت إضافة أيقونة بريميوم لحسابك',
        titleEn: 'Premium App Icon Added',
        messageAr: `تم فتح أيقونة التطبيق المميزة «${iconDef.name}» وإضافتها إلى مقتنياتك الدائمة.`,
        messageEn: `Premium app icon "${iconDef.nameEn}" has been permanently unlocked for your account.`,
        dedupeKey: `premium_icon_perm:${iconId}`,
      });
    }
    return { ok: true };
  } catch (error) {
    console.error('Database error in purchaseIconForUser:', error);
    throw new Error('Failed to unlock permanent app icon access.', { cause: error });
  }
}

export async function setUserActiveAppIcon(
  userUid: string,
  iconId: string
): Promise<{ ok: boolean; error?: string; activeIconId?: string }> {
  try {
    const cleanId = iconId.trim();
    if (!isValidAppIconId(cleanId)) {
      return { ok: false, error: 'أيقونة التطبيق المطلوبة غير موجودة.' };
    }
    const iconDef = getAppIconById(cleanId);
    if (iconDef.isPremium) {
      const [[purchase], [grant]] = await Promise.all([
        db
          .select({ id: userIconPurchases.id })
          .from(userIconPurchases)
          .where(and(eq(userIconPurchases.userUid, userUid), eq(userIconPurchases.iconId, cleanId)))
          .limit(1),
        db
          .select({ id: userCodeGrants.id })
          .from(userCodeGrants)
          .where(
            and(
              eq(userCodeGrants.userUid, userUid),
              eq(userCodeGrants.targetType, 'icon'),
              eq(userCodeGrants.targetId, cleanId)
            )
          )
          .limit(1),
      ]);
      if (!purchase && !grant) {
        return { ok: false, error: 'يجب فتح أو شراء هذه الأيقونة البريميوم أولاً قبل تطبيقها.' };
      }
    }

    await db.update(users).set({ activeIconId: cleanId }).where(eq(users.uid, userUid));
    return { ok: true, activeIconId: cleanId };
  } catch (error) {
    console.error('Database error in setUserActiveAppIcon:', error);
    throw new Error('Failed to save active app icon.', { cause: error });
  }
}

export async function redeemRotatingCodeForUser(
  userUid: string,
  rawCode: string,
  targetId?: string
): Promise<{
  ok: boolean;
  kind?: 'book' | 'theme' | 'icon';
  id?: string;
  label?: string;
  expiresAt?: string;
}> {
  try {
    await ensureCatalogSeeded();
    await refreshExpiredRotatingCodes();

    const code = rawCode.replace(/\D/g, '');
    if (code.length !== 10) {
      return { ok: false };
    }

    const now = new Date();
    const farFuture = new Date(now.getTime() + SINGLE_USE_GRANT_FAR_FUTURE_MS);

    const matchedBooks = await db
      .select()
      .from(books)
      .where(and(eq(books.isPremium, true), eq(books.rotatingCode, code)));

    const matchedBook = targetId
      ? matchedBooks.find((b) => b.id === targetId)
      : matchedBooks[0];

    if (matchedBook && !matchedBook.isComingSoon && matchedBook.reviewStatus === 'approved') {
      const [[existingPurchase], [existingGrant]] = await Promise.all([
        db
          .select({ id: userBookPurchases.id })
          .from(userBookPurchases)
          .where(
            and(
              eq(userBookPurchases.userUid, userUid),
              eq(userBookPurchases.bookId, matchedBook.id)
            )
          )
          .limit(1),
        db
          .select({ id: userCodeGrants.id })
          .from(userCodeGrants)
          .where(
            and(
              eq(userCodeGrants.userUid, userUid),
              eq(userCodeGrants.targetType, 'book'),
              eq(userCodeGrants.targetId, matchedBook.id)
            )
          )
          .limit(1),
      ]);

      if (existingPurchase || existingGrant) {
        return {
          ok: true,
          kind: 'book',
          id: matchedBook.id,
          label: matchedBook.title,
        };
      }

      const taken = await getTakenCodesSet(matchedBook.id);
      const nextCode = generateUniqueTenDigitCode(taken);

      const claimed = await db.transaction(async (tx) => {
        const updated = await tx
          .update(books)
          .set({
            rotatingCode: nextCode,
            codeRotatedAt: now,
            codeExpiresAt: farFuture,
          })
          .where(and(eq(books.id, matchedBook.id), eq(books.rotatingCode, code)))
          .returning({ id: books.id });

        if (updated.length === 0) {
          return false;
        }

        await tx
          .insert(userCodeGrants)
          .values({
            userUid,
            targetType: 'book',
            targetId: matchedBook.id,
            codeSnapshot: code,
            grantedAt: now,
            expiresAt: farFuture,
          })
          .onConflictDoUpdate({
            target: [userCodeGrants.userUid, userCodeGrants.targetType, userCodeGrants.targetId],
            set: {
              codeSnapshot: code,
              grantedAt: now,
              expiresAt: farFuture,
            },
          });

        return true;
      });

      if (!claimed) {
        return { ok: false };
      }

      await createUserNotification({
        userUid,
        type: 'premium',
        titleAr: 'تم تفعيل كتاب بريميوم',
        titleEn: 'Premium Book Activated',
        messageAr: `تم تفعيل الوصول إلى كتاب «${matchedBook.title}» وإضافته لقائمتك البريميوم.`,
        messageEn: `Access to "${matchedBook.title}" has been activated on your account.`,
        targetBookId: matchedBook.id,
        dedupeKey: `premium_code:book:${matchedBook.id}:${code}`,
      });

      await bumpCatalogVersion();

      return {
        ok: true,
        kind: 'book',
        id: matchedBook.id,
        label: matchedBook.title,
      };
    }

    const matchedThemes = await db
      .select()
      .from(premiumThemes)
      .where(eq(premiumThemes.rotatingCode, code));
    const matchedTheme = targetId
      ? matchedThemes.find((t) => t.id === targetId)
      : matchedThemes[0];

    if (matchedTheme) {
      const [[existingPurchase], [existingGrant]] = await Promise.all([
        db
          .select({ id: userThemePurchases.id })
          .from(userThemePurchases)
          .where(
            and(
              eq(userThemePurchases.userUid, userUid),
              eq(userThemePurchases.themeId, matchedTheme.id)
            )
          )
          .limit(1),
        db
          .select({ id: userCodeGrants.id })
          .from(userCodeGrants)
          .where(
            and(
              eq(userCodeGrants.userUid, userUid),
              eq(userCodeGrants.targetType, 'theme'),
              eq(userCodeGrants.targetId, matchedTheme.id)
            )
          )
          .limit(1),
      ]);

      if (existingPurchase || existingGrant) {
        return {
          ok: true,
          kind: 'theme',
          id: matchedTheme.id,
          label: matchedTheme.id,
        };
      }

      const taken = await getTakenCodesSet(matchedTheme.id);
      const nextCode = generateUniqueTenDigitCode(taken);

      const claimed = await db.transaction(async (tx) => {
        const updated = await tx
          .update(premiumThemes)
          .set({
            rotatingCode: nextCode,
            codeRotatedAt: now,
            codeExpiresAt: farFuture,
          })
          .where(and(eq(premiumThemes.id, matchedTheme.id), eq(premiumThemes.rotatingCode, code)))
          .returning({ id: premiumThemes.id });

        if (updated.length === 0) {
          return false;
        }

        await tx
          .insert(userCodeGrants)
          .values({
            userUid,
            targetType: 'theme',
            targetId: matchedTheme.id,
            codeSnapshot: code,
            grantedAt: now,
            expiresAt: farFuture,
          })
          .onConflictDoUpdate({
            target: [userCodeGrants.userUid, userCodeGrants.targetType, userCodeGrants.targetId],
            set: {
              codeSnapshot: code,
              grantedAt: now,
              expiresAt: farFuture,
            },
          });

        return true;
      });

      if (!claimed) {
        return { ok: false };
      }

      const themeDef = THEME_CATALOG.find((t) => t.id === matchedTheme.id);
      const themeAr = themeDef?.name ?? matchedTheme.id;
      const themeEn = themeDef?.nameEn ?? matchedTheme.id;
      await createUserNotification({
        userUid,
        type: 'premium',
        titleAr: 'تم تفعيل سمة بريميوم',
        titleEn: 'Premium Theme Activated',
        messageAr: `تم تفعيل السمة الملكية «${themeAr}» وإضافتها إلى حسابك.`,
        messageEn: `Premium theme "${themeEn}" has been activated on your account.`,
        dedupeKey: `premium_code:theme:${matchedTheme.id}:${code}`,
      });

      await bumpCatalogVersion();

      return {
        ok: true,
        kind: 'theme',
        id: matchedTheme.id,
        label: matchedTheme.id,
      };
    }

    const matchedIcons = await db
      .select()
      .from(premiumIcons)
      .where(eq(premiumIcons.rotatingCode, code));
    const matchedIcon = targetId
      ? matchedIcons.find((ic) => ic.id === targetId)
      : matchedIcons[0];

    if (matchedIcon) {
      const [[existingPurchase], [existingGrant]] = await Promise.all([
        db
          .select({ id: userIconPurchases.id })
          .from(userIconPurchases)
          .where(
            and(
              eq(userIconPurchases.userUid, userUid),
              eq(userIconPurchases.iconId, matchedIcon.id)
            )
          )
          .limit(1),
        db
          .select({ id: userCodeGrants.id })
          .from(userCodeGrants)
          .where(
            and(
              eq(userCodeGrants.userUid, userUid),
              eq(userCodeGrants.targetType, 'icon'),
              eq(userCodeGrants.targetId, matchedIcon.id)
            )
          )
          .limit(1),
      ]);

      const iconDef = getAppIconById(matchedIcon.id);
      if (existingPurchase || existingGrant) {
        return {
          ok: true,
          kind: 'icon',
          id: matchedIcon.id,
          label: iconDef.name,
        };
      }

      const taken = await getTakenCodesSet(matchedIcon.id);
      const nextCode = generateUniqueTenDigitCode(taken);

      const claimed = await db.transaction(async (tx) => {
        const updated = await tx
          .update(premiumIcons)
          .set({
            rotatingCode: nextCode,
            codeRotatedAt: now,
            codeExpiresAt: farFuture,
          })
          .where(and(eq(premiumIcons.id, matchedIcon.id), eq(premiumIcons.rotatingCode, code)))
          .returning({ id: premiumIcons.id });

        if (updated.length === 0) {
          return false;
        }

        await tx
          .insert(userCodeGrants)
          .values({
            userUid,
            targetType: 'icon',
            targetId: matchedIcon.id,
            codeSnapshot: code,
            grantedAt: now,
            expiresAt: farFuture,
          })
          .onConflictDoUpdate({
            target: [userCodeGrants.userUid, userCodeGrants.targetType, userCodeGrants.targetId],
            set: {
              codeSnapshot: code,
              grantedAt: now,
              expiresAt: farFuture,
            },
          });

        return true;
      });

      if (!claimed) {
        return { ok: false };
      }

      await createUserNotification({
        userUid,
        type: 'premium',
        titleAr: 'تم تفعيل أيقونة بريميوم',
        titleEn: 'Premium App Icon Activated',
        messageAr: `تم تفعيل أيقونة التطبيق «${iconDef.name}» وإضافتها إلى حسابك.`,
        messageEn: `Premium app icon "${iconDef.nameEn}" has been activated on your account.`,
        dedupeKey: `premium_code:icon:${matchedIcon.id}:${code}`,
      });

      await bumpCatalogVersion();

      return {
        ok: true,
        kind: 'icon',
        id: matchedIcon.id,
        label: iconDef.name,
      };
    }

    return { ok: false };
  } catch (error) {
    console.error('Database error in redeemRotatingCodeForUser:', error);
    throw new Error('Failed to verify rotating access code.', { cause: error });
  }
}

export async function upsertUserReadingProgress(
  userUid: string,
  progress: {
    bookId: string;
    chapterIndex: number;
    scrollRatio: number;
    bookmarks: number[];
    lastReadAt: string;
  }
): Promise<{ completedNow: boolean }> {
  try {
    await db
      .insert(readingProgress)
      .values({
        userUid,
        bookId: progress.bookId,
        chapterIndex: progress.chapterIndex,
        scrollRatio: progress.scrollRatio,
        bookmarksJson: progress.bookmarks,
        lastReadAt: progress.lastReadAt,
      })
      .onConflictDoUpdate({
        target: [readingProgress.userUid, readingProgress.bookId],
        set: {
          chapterIndex: progress.chapterIndex,
          scrollRatio: progress.scrollRatio,
          bookmarksJson: progress.bookmarks,
          lastReadAt: progress.lastReadAt,
        },
      });

    const [book] = await db
      .select({
        id: books.id,
        title: books.title,
        bookType: books.bookType,
        pdfPageCount: books.pdfPageCount,
        pages: books.pages,
        chaptersJson: books.chaptersJson,
      })
      .from(books)
      .where(eq(books.id, progress.bookId))
      .limit(1);

    let completedNow = false;
    if (book) {
      const isFlip = book.bookType === 'pdf' || book.bookType === 'word';
      const totalUnits = isFlip
        ? Math.max(1, book.pdfPageCount ?? book.pages ?? 1)
        : Math.max(1, book.chaptersJson?.length ?? 0);
      const isCompleted =
        totalUnits <= 1
          ? progress.scrollRatio >= 0.8 || progress.chapterIndex >= 1
          : progress.chapterIndex >= totalUnits - 1;

      if (isCompleted) {
        completedNow = true;
        await createUserNotification({
          userUid,
          type: 'book_completed',
          titleAr: 'أتممت قراءة كتاب!',
          titleEn: 'Book Completed!',
          messageAr: `أحسنت! أنهيت قراءة كتاب «${book.title}» بالكامل (%100).`,
          messageEn: `Well done! You finished reading "${book.title}" (100%).`,
          targetBookId: book.id,
          dedupeKey: `book_completed:${book.id}`,
        });

        const economy = await getTokenEconomyConfig();
        if (economy.rewardBookCompleted > 0) {
          await creditUserTokens({
            userUid,
            amount: economy.rewardBookCompleted,
            kind: 'reward_book_completed',
            descriptionAr: `مكافأة إتمام قراءة كتاب «${book.title}»`,
            descriptionEn: `Reward for completing "${book.title}"`,
            targetBookId: book.id,
            dedupeKey: `reward:book_completed:${book.id}`,
          });
        }
      }
    }
    return { completedNow };
  } catch (error) {
    console.error('Database error in upsertUserReadingProgress:', error);
    throw new Error('Failed to save reading progress.', { cause: error });
  }
}

export async function purchaseItemWithTokens(
  userUid: string,
  targetType: 'book' | 'theme' | 'icon',
  targetId: string
): Promise<{
  ok: boolean;
  error?: string;
  kind?: 'book' | 'theme' | 'icon';
  id?: string;
  label?: string;
  cost?: number;
  newBalance?: number;
}> {
  try {
    await ensureCatalogSeeded();
    const economy = await getTokenEconomyConfig();
    const cleanTargetId = targetId.trim();

    if (targetType === 'book') {
      const [book] = await db.select().from(books).where(eq(books.id, cleanTargetId)).limit(1);
      if (!book || !book.isPremium || book.reviewStatus !== 'approved') {
        return { ok: false, error: 'الكتاب البريميوم المطلوب غير متاح.' };
      }
      if (book.isComingSoon) {
        return {
          ok: false,
          error: 'هذا الكتاب في قائمة «قريباً» — يمكنك طلبه مسبقاً (Pre-Order) بدلاً من الشراء الفوري.',
        };
      }
      if (book.authorUid && book.authorUid === userUid) {
        return { ok: false, error: 'لا يمكنك شراء كتابك الخاص بالعملات.' };
      }
      const cost = resolveEffectiveBookTokenPrice(book, economy);

      const txRes = await db.transaction(async (tx) => {
        const [[existingPurchase], [existingGrant]] = await Promise.all([
          tx
            .select({ id: userBookPurchases.id })
            .from(userBookPurchases)
            .where(and(eq(userBookPurchases.userUid, userUid), eq(userBookPurchases.bookId, book.id)))
            .limit(1),
          tx
            .select({ id: userCodeGrants.id })
            .from(userCodeGrants)
            .where(
              and(
                eq(userCodeGrants.userUid, userUid),
                eq(userCodeGrants.targetType, 'book'),
                eq(userCodeGrants.targetId, book.id)
              )
            )
            .limit(1),
        ]);

        if (existingPurchase || existingGrant) {
          const [u] = await tx
            .select({ tokensBalance: users.tokensBalance })
            .from(users)
            .where(eq(users.uid, userUid))
            .limit(1);
          return {
            ok: false as const,
            error: 'أنت تمتلك هذا الكتاب البريميوم بالفعل.',
            newBalance: u?.tokensBalance ?? 0,
          };
        }

        let newBalance = 0;
        let authorCredited = false;
        if (cost > 0) {
          const debited = await tx
            .update(users)
            .set({ tokensBalance: sql`${users.tokensBalance} - ${cost}` })
            .where(and(eq(users.uid, userUid), gte(users.tokensBalance, cost)))
            .returning({ tokensBalance: users.tokensBalance });

          if (debited.length === 0) {
            const [u] = await tx
              .select({ tokensBalance: users.tokensBalance })
              .from(users)
              .where(eq(users.uid, userUid))
              .limit(1);
            return {
              ok: false as const,
              error: `رصيد العملات الذهبية غير كافٍ (المطلوب: ${cost}، المتاح: ${u?.tokensBalance ?? 0}).`,
              newBalance: u?.tokensBalance ?? 0,
            };
          }
          newBalance = debited[0].tokensBalance;

          await tx.insert(tokenTransactions).values({
            id: `tok-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            userUid,
            amount: -cost,
            kind: 'purchase_book',
            descriptionAr: `شراء الكتاب البريميوم «${book.title}» بالعملات الذهبية`,
            descriptionEn: `Purchased premium book "${book.title}" with Golden Tokens`,
            targetBookId: book.id,
            dedupeKey: null,
          });

          if (book.authorUid && book.authorUid !== userUid) {
            const creditedAuthor = await tx
              .update(users)
              .set({ tokensBalance: sql`${users.tokensBalance} + ${cost}` })
              .where(eq(users.uid, book.authorUid))
              .returning({ uid: users.uid });
            if (creditedAuthor.length > 0) {
              authorCredited = true;
              await tx.insert(tokenTransactions).values({
                id: `tok-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                userUid: book.authorUid,
                amount: cost,
                kind: 'book_sale_revenue',
                descriptionAr: `عائد بيع كتابك «${book.title}» لأحد القراء`,
                descriptionEn: `Sale revenue from your book "${book.title}"`,
                targetBookId: book.id,
                dedupeKey: null,
              });
            }
          }
        } else {
          const [u] = await tx
            .select({ tokensBalance: users.tokensBalance })
            .from(users)
            .where(eq(users.uid, userUid))
            .limit(1);
          newBalance = u?.tokensBalance ?? 0;
        }

        await tx
          .insert(userBookPurchases)
          .values({
            userUid,
            bookId: book.id,
            grantedBy: 'tokens',
          })
          .onConflictDoNothing();

        return { ok: true as const, newBalance, authorCredited };
      });

      if (!txRes.ok) {
        return { ok: false, error: txRes.error, newBalance: txRes.newBalance };
      }

      await createUserNotification({
        userUid,
        type: 'premium',
        titleAr: 'تم شراء كتاب بريميوم بالعملات',
        titleEn: 'Premium Book Unlocked with Tokens',
        messageAr: `تم فتح كتاب «${book.title}» دائماً في حسابك مقابل ${cost} عملة ذهبية.`,
        messageEn: `"${book.title}" is now permanently unlocked on your account for ${cost} Golden Tokens.`,
        targetBookId: book.id,
        dedupeKey: `premium_tokens:book:${book.id}:${Date.now()}`,
      });

      if (txRes.authorCredited && book.authorUid && cost > 0) {
        const [buyerRow] = await db
          .select({ displayName: users.displayName })
          .from(users)
          .where(eq(users.uid, userUid))
          .limit(1);
        const buyerName = (buyerRow?.displayName || 'قارئ').trim();
        await createUserNotification({
          userUid: book.authorUid,
          type: 'book_sale',
          titleAr: 'تم شراء كتابك! أُضيفت عملات لحسابك',
          titleEn: 'Your Book Was Sold! Tokens Added',
          messageAr: `اشترى ${buyerName} كتابك «${book.title}» مقابل ${cost} عملة ذهبية وتمت إضافة المبلغ إلى رصيدك.`,
          messageEn: `${buyerName} purchased your book "${book.title}" for ${cost} Golden Tokens, and the full amount was credited to your balance.`,
          targetBookId: book.id,
          targetUserUid: userUid,
          dedupeKey: `book_sale:${book.id}:${userUid}:${Date.now()}`,
        });
      }

      await bumpCatalogVersion();
      return {
        ok: true,
        kind: 'book',
        id: book.id,
        label: book.title,
        cost,
        newBalance: txRes.newBalance,
      };
    }

    if (targetType === 'icon') {
      const [iconRow] = await db
        .select()
        .from(premiumIcons)
        .where(eq(premiumIcons.id, cleanTargetId))
        .limit(1);
      if (!iconRow) {
        return { ok: false, error: 'أيقونة التطبيق البريميوم المطلوبة غير موجودة.' };
      }
      const iconDef = getAppIconById(cleanTargetId);
      const cost = resolveEffectiveIconTokenPrice(iconRow, economy);

      const txRes = await db.transaction(async (tx) => {
        const [[existingPurchase], [existingGrant]] = await Promise.all([
          tx
            .select({ id: userIconPurchases.id })
            .from(userIconPurchases)
            .where(and(eq(userIconPurchases.userUid, userUid), eq(userIconPurchases.iconId, cleanTargetId)))
            .limit(1),
          tx
            .select({ id: userCodeGrants.id })
            .from(userCodeGrants)
            .where(
              and(
                eq(userCodeGrants.userUid, userUid),
                eq(userCodeGrants.targetType, 'icon'),
                eq(userCodeGrants.targetId, cleanTargetId)
              )
            )
            .limit(1),
        ]);

        if (existingPurchase || existingGrant) {
          const [u] = await tx
            .select({ tokensBalance: users.tokensBalance })
            .from(users)
            .where(eq(users.uid, userUid))
            .limit(1);
          return {
            ok: false as const,
            error: 'أنت تمتلك هذه الأيقونة البريميوم بالفعل.',
            newBalance: u?.tokensBalance ?? 0,
          };
        }

        let newBalance = 0;
        if (cost > 0) {
          const debited = await tx
            .update(users)
            .set({ tokensBalance: sql`${users.tokensBalance} - ${cost}` })
            .where(and(eq(users.uid, userUid), gte(users.tokensBalance, cost)))
            .returning({ tokensBalance: users.tokensBalance });

          if (debited.length === 0) {
            const [u] = await tx
              .select({ tokensBalance: users.tokensBalance })
              .from(users)
              .where(eq(users.uid, userUid))
              .limit(1);
            return {
              ok: false as const,
              error: `رصيد العملات الذهبية غير كافٍ (المطلوب: ${cost}، المتاح: ${u?.tokensBalance ?? 0}).`,
              newBalance: u?.tokensBalance ?? 0,
            };
          }
          newBalance = debited[0].tokensBalance;

          await tx.insert(tokenTransactions).values({
            id: `tok-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            userUid,
            amount: -cost,
            kind: 'purchase_icon',
            descriptionAr: `شراء أيقونة التطبيق البريميوم «${iconDef.name}» بالعملات الذهبية`,
            descriptionEn: `Purchased premium app icon "${iconDef.nameEn}" with Golden Tokens`,
            targetThemeId: cleanTargetId,
            dedupeKey: null,
          });
        } else {
          const [u] = await tx
            .select({ tokensBalance: users.tokensBalance })
            .from(users)
            .where(eq(users.uid, userUid))
            .limit(1);
          newBalance = u?.tokensBalance ?? 0;
        }

        await tx
          .insert(userIconPurchases)
          .values({
            userUid,
            iconId: cleanTargetId,
            grantedBy: 'tokens',
          })
          .onConflictDoNothing();

        return { ok: true as const, newBalance };
      });

      if (!txRes.ok) {
        return { ok: false, error: txRes.error, newBalance: txRes.newBalance };
      }

      await createUserNotification({
        userUid,
        type: 'premium',
        titleAr: 'تم شراء أيقونة بريميوم بالعملات',
        titleEn: 'Premium App Icon Unlocked with Tokens',
        messageAr: `تم تفعيل أيقونة التطبيق «${iconDef.name}» دائماً في حسابك مقابل ${cost} عملة ذهبية.`,
        messageEn: `Premium app icon "${iconDef.nameEn}" has been permanently unlocked for ${cost} Golden Tokens.`,
        dedupeKey: `premium_tokens:icon:${cleanTargetId}:${Date.now()}`,
      });

      await bumpCatalogVersion();
      return {
        ok: true,
        kind: 'icon',
        id: cleanTargetId,
        label: iconDef.name,
        cost,
        newBalance: txRes.newBalance,
      };
    }

    const [themeRow] = await db
      .select()
      .from(premiumThemes)
      .where(eq(premiumThemes.id, cleanTargetId))
      .limit(1);
    if (!themeRow) {
      return { ok: false, error: 'السمة البريميوم المطلوبة غير موجودة.' };
    }
    const themeDef = THEME_CATALOG.find((t) => t.id === cleanTargetId);
    const themeAr = themeDef?.name ?? cleanTargetId;
    const themeEn = themeDef?.nameEn ?? cleanTargetId;
    const cost = resolveEffectiveThemeTokenPrice(themeRow, economy);

    const txRes = await db.transaction(async (tx) => {
      const [[existingPurchase], [existingGrant]] = await Promise.all([
        tx
          .select({ id: userThemePurchases.id })
          .from(userThemePurchases)
          .where(and(eq(userThemePurchases.userUid, userUid), eq(userThemePurchases.themeId, cleanTargetId)))
          .limit(1),
        tx
          .select({ id: userCodeGrants.id })
          .from(userCodeGrants)
          .where(
            and(
              eq(userCodeGrants.userUid, userUid),
              eq(userCodeGrants.targetType, 'theme'),
              eq(userCodeGrants.targetId, cleanTargetId)
            )
          )
          .limit(1),
      ]);

      if (existingPurchase || existingGrant) {
        const [u] = await tx
          .select({ tokensBalance: users.tokensBalance })
          .from(users)
          .where(eq(users.uid, userUid))
          .limit(1);
        return {
          ok: false as const,
          error: 'أنت تمتلك هذه السمة البريميوم بالفعل.',
          newBalance: u?.tokensBalance ?? 0,
        };
      }

      let newBalance = 0;
      if (cost > 0) {
        const debited = await tx
          .update(users)
          .set({ tokensBalance: sql`${users.tokensBalance} - ${cost}` })
          .where(and(eq(users.uid, userUid), gte(users.tokensBalance, cost)))
          .returning({ tokensBalance: users.tokensBalance });

        if (debited.length === 0) {
          const [u] = await tx
            .select({ tokensBalance: users.tokensBalance })
            .from(users)
            .where(eq(users.uid, userUid))
            .limit(1);
          return {
            ok: false as const,
            error: `رصيد العملات الذهبية غير كافٍ (المطلوب: ${cost}، المتاح: ${u?.tokensBalance ?? 0}).`,
            newBalance: u?.tokensBalance ?? 0,
          };
        }
        newBalance = debited[0].tokensBalance;

        await tx.insert(tokenTransactions).values({
          id: `tok-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userUid,
          amount: -cost,
          kind: 'purchase_theme',
          descriptionAr: `شراء السمة البريميوم «${themeAr}» بالعملات الذهبية`,
          descriptionEn: `Purchased premium theme "${themeEn}" with Golden Tokens`,
          targetThemeId: cleanTargetId,
          dedupeKey: null,
        });
      } else {
        const [u] = await tx
          .select({ tokensBalance: users.tokensBalance })
          .from(users)
          .where(eq(users.uid, userUid))
          .limit(1);
        newBalance = u?.tokensBalance ?? 0;
      }

      await tx
        .insert(userThemePurchases)
        .values({
          userUid,
          themeId: cleanTargetId,
          grantedBy: 'tokens',
        })
        .onConflictDoNothing();

      return { ok: true as const, newBalance };
    });

    if (!txRes.ok) {
      return { ok: false, error: txRes.error, newBalance: txRes.newBalance };
    }

    await createUserNotification({
      userUid,
      type: 'premium',
      titleAr: 'تم شراء سمة بريميوم بالعملات',
      titleEn: 'Premium Theme Unlocked with Tokens',
      messageAr: `تم تفعيل السمة الملكية «${themeAr}» دائماً في حسابك مقابل ${cost} عملة ذهبية.`,
      messageEn: `Premium theme "${themeEn}" has been permanently unlocked for ${cost} Golden Tokens.`,
      dedupeKey: `premium_tokens:theme:${cleanTargetId}:${Date.now()}`,
    });

    await bumpCatalogVersion();
    return {
      ok: true,
      kind: 'theme',
      id: cleanTargetId,
      label: themeAr,
      cost,
      newBalance: txRes.newBalance,
    };
  } catch (error) {
    console.error('Database error in purchaseItemWithTokens:', error);
    throw new Error('Failed to purchase premium item with tokens.', { cause: error });
  }
}

export async function preorderBookWithTokens(
  userUid: string,
  bookId: string
): Promise<{
  ok: boolean;
  error?: string;
  id?: string;
  label?: string;
  cost?: number;
  discountPercent?: number | null;
  newBalance?: number;
}> {
  try {
    await ensureCatalogSeeded();
    const economy = await getTokenEconomyConfig();
    const cleanBookId = bookId.trim();
    const [book] = await db.select().from(books).where(eq(books.id, cleanBookId)).limit(1);
    if (!book || book.reviewStatus !== 'approved') {
      return { ok: false, error: 'الكتاب المطلوب غير متاح.' };
    }
    if (!book.isComingSoon) {
      return { ok: false, error: 'هذا الكتاب منشور بالفعل — يمكنك شراؤه مباشرة.' };
    }
    if (!book.isPremium) {
      return { ok: false, error: 'الطلب المسبق متاح للكتب البريميوم المسعّرة فقط.' };
    }
    if (book.authorUid && book.authorUid === userUid) {
      return { ok: false, error: 'لا يمكنك طلب كتابك الخاص مسبقاً.' };
    }

    const pricing = getBookSalePricing(book, economy);
    const cost = pricing.effectiveTokenPrice;

    const txRes = await db.transaction(async (tx) => {
      const [[existingPurchase], [existingGrant], [existingPreorder]] = await Promise.all([
        tx
          .select({ id: userBookPurchases.id })
          .from(userBookPurchases)
          .where(and(eq(userBookPurchases.userUid, userUid), eq(userBookPurchases.bookId, book.id)))
          .limit(1),
        tx
          .select({ id: userCodeGrants.id })
          .from(userCodeGrants)
          .where(
            and(
              eq(userCodeGrants.userUid, userUid),
              eq(userCodeGrants.targetType, 'book'),
              eq(userCodeGrants.targetId, book.id)
            )
          )
          .limit(1),
        tx
          .select({ id: bookPreorders.id })
          .from(bookPreorders)
          .where(and(eq(bookPreorders.userUid, userUid), eq(bookPreorders.bookId, book.id)))
          .limit(1),
      ]);

      if (existingPurchase || existingGrant || existingPreorder) {
        const [u] = await tx
          .select({ tokensBalance: users.tokensBalance })
          .from(users)
          .where(eq(users.uid, userUid))
          .limit(1);
        return {
          ok: false as const,
          error: 'لقد قمت بالطلب المسبق لهذا الكتاب بالفعل أو تمتلكه في حسابك.',
          newBalance: u?.tokensBalance ?? 0,
        };
      }

      let newBalance = 0;
      let authorCredited = false;
      if (cost > 0) {
        const debited = await tx
          .update(users)
          .set({ tokensBalance: sql`${users.tokensBalance} - ${cost}` })
          .where(and(eq(users.uid, userUid), gte(users.tokensBalance, cost)))
          .returning({ tokensBalance: users.tokensBalance });

        if (debited.length === 0) {
          const [u] = await tx
            .select({ tokensBalance: users.tokensBalance })
            .from(users)
            .where(eq(users.uid, userUid))
            .limit(1);
          return {
            ok: false as const,
            error: `رصيد العملات الذهبية غير كافٍ للطلب المسبق (المطلوب: ${cost}، المتاح: ${u?.tokensBalance ?? 0}).`,
            newBalance: u?.tokensBalance ?? 0,
          };
        }
        newBalance = debited[0].tokensBalance;

        await tx.insert(tokenTransactions).values({
          id: `tok-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userUid,
          amount: -cost,
          kind: 'preorder_book',
          descriptionAr:
            pricing.discountPercent !== null
              ? `طلب مسبق لكتاب «${book.title}» (شامل خصم ${pricing.discountPercent}%)`
              : `طلب مسبق لكتاب «${book.title}»`,
          descriptionEn:
            pricing.discountPercent !== null
              ? `Pre-ordered "${book.title}" (${pricing.discountPercent}% launch sale)`
              : `Pre-ordered "${book.title}"`,
          targetBookId: book.id,
          dedupeKey: null,
        });

        if (book.authorUid && book.authorUid !== userUid) {
          const creditedAuthor = await tx
            .update(users)
            .set({ tokensBalance: sql`${users.tokensBalance} + ${cost}` })
            .where(eq(users.uid, book.authorUid))
            .returning({ uid: users.uid });
          if (creditedAuthor.length > 0) {
            authorCredited = true;
            await tx.insert(tokenTransactions).values({
              id: `tok-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              userUid: book.authorUid,
              amount: cost,
              kind: 'book_sale_revenue',
              descriptionAr: `عائد طلب مسبق لكتابك «${book.title}»`,
              descriptionEn: `Pre-order revenue from your book "${book.title}"`,
              targetBookId: book.id,
              dedupeKey: null,
            });
          }
        }
      } else {
        const [u] = await tx
          .select({ tokensBalance: users.tokensBalance })
          .from(users)
          .where(eq(users.uid, userUid))
          .limit(1);
        newBalance = u?.tokensBalance ?? 0;
      }

      await tx
        .insert(bookPreorders)
        .values({
          userUid,
          bookId: book.id,
          tokensPaid: cost,
          discountPercentSnapshot: pricing.discountPercent ?? null,
          status: 'pending',
        })
        .onConflictDoNothing();

      return { ok: true as const, newBalance, authorCredited };
    });

    if (!txRes.ok) {
      return { ok: false, error: txRes.error, newBalance: txRes.newBalance };
    }

    await createUserNotification({
      userUid,
      type: 'preorder_confirmed',
      titleAr: 'تم تأكيد طلبك المسبق!',
      titleEn: 'Pre-Order Confirmed!',
      messageAr:
        pricing.discountPercent !== null
          ? `تم حجز طلبك المسبق لكتاب «${book.title}» بسعر الخصم (${cost} عملة ذهبية) وسيُفتح تلقائياً فور صدوره.`
          : `تم حجز طلبك المسبق لكتاب «${book.title}» مقابل ${cost} عملة ذهبية وسيُفتح تلقائياً فور صدوره.`,
      messageEn:
        pricing.discountPercent !== null
          ? `Your pre-order for "${book.title}" is locked in at the ${pricing.discountPercent}% sale price (${cost} Golden Tokens) and will unlock automatically upon release.`
          : `Your pre-order for "${book.title}" (${cost} Golden Tokens) is confirmed and will unlock automatically upon release.`,
      targetBookId: book.id,
      dedupeKey: `preorder_confirmed:${book.id}:${userUid}`,
    });

    if (txRes.authorCredited && book.authorUid && cost > 0) {
      const [buyerRow] = await db
        .select({ displayName: users.displayName })
        .from(users)
        .where(eq(users.uid, userUid))
        .limit(1);
      const buyerName = (buyerRow?.displayName || 'قارئ').trim();
      await createUserNotification({
        userUid: book.authorUid,
        type: 'book_sale',
        titleAr: 'طلب مسبق جديد على كتابك! أُضيفت عملات لحسابك',
        titleEn: 'New Pre-Order for Your Book! Tokens Added',
        messageAr: `طلب ${buyerName} كتابك القادم «${book.title}» مسبقاً مقابل ${cost} عملة ذهبية وتمت إضافة المبلغ إلى رصيدك.`,
        messageEn: `${buyerName} pre-ordered your upcoming book "${book.title}" for ${cost} Golden Tokens, and the full amount was credited to your balance.`,
        targetBookId: book.id,
        targetUserUid: userUid,
        dedupeKey: `book_sale_preorder:${book.id}:${userUid}:${Date.now()}`,
      });
    }

    await bumpCatalogVersion();
    return {
      ok: true,
      id: book.id,
      label: book.title,
      cost,
      discountPercent: pricing.discountPercent,
      newBalance: txRes.newBalance,
    };
  } catch (error) {
    console.error('Database error in preorderBookWithTokens:', error);
    throw new Error('Failed to pre-order book with tokens.', { cause: error });
  }
}

export async function clearUserReadingProgress(userUid: string): Promise<void> {
  try {
    await db.delete(readingProgress).where(eq(readingProgress.userUid, userUid));
  } catch (error) {
    console.error('Database error in clearUserReadingProgress:', error);
    throw new Error('Failed to clear reading progress.', { cause: error });
  }
}

export async function getDocumentForUser(
  userUid: string | null,
  pdfId: string,
  isDev: boolean
): Promise<{
  allowed: boolean;
  found: boolean;
  fileName?: string;
  mimeType?: string;
  dataBase64?: string;
}> {
  try {
    const [doc] = await db.select().from(bookDocuments).where(eq(bookDocuments.id, pdfId));
    if (!doc) {
      return { allowed: true, found: false };
    }

    const [book] = await db.select().from(books).where(eq(books.id, doc.bookId));
    const isOwner = Boolean(userUid && book?.authorUid === userUid);
    if (book && book.reviewStatus !== 'approved' && !isDev && !isOwner) {
      return { allowed: false, found: true };
    }
    if (book?.isComingSoon && !isDev && !(isOwner && book.reviewStatus !== 'approved')) {
      return { allowed: false, found: true };
    }
    if (!book || !book.isPremium || isDev || (isOwner && book.reviewStatus !== 'approved')) {
      return {
        allowed: true,
        found: true,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        dataBase64: doc.dataBase64,
      };
    }

    if (!userUid) {
      return { allowed: false, found: true };
    }

    const [purchase] = await db
      .select()
      .from(userBookPurchases)
      .where(and(eq(userBookPurchases.userUid, userUid), eq(userBookPurchases.bookId, book.id)));

    if (purchase) {
      return {
        allowed: true,
        found: true,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        dataBase64: doc.dataBase64,
      };
    }

    const [grant] = await db
      .select()
      .from(userCodeGrants)
      .where(
        and(
          eq(userCodeGrants.userUid, userUid),
          eq(userCodeGrants.targetType, 'book'),
          eq(userCodeGrants.targetId, book.id)
        )
      );

    if (grant) {
      return {
        allowed: true,
        found: true,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        dataBase64: doc.dataBase64,
      };
    }

    return { allowed: false, found: true };
  } catch (error) {
    console.error('Database error in getDocumentForUser:', error);
    throw new Error('Failed to load book document.', { cause: error });
  }
}

// ============================================================================
// Developer Repository Operations
// ============================================================================

async function notifyFollowersOfNewRelease(
  authorUid: string,
  authorName: string,
  bookId: string,
  bookTitle: string
): Promise<void> {
  const followers = await db
    .select({ followerUid: userFollows.followerUid })
    .from(userFollows)
    .where(eq(userFollows.targetUid, authorUid));
  for (const f of followers) {
    if (f.followerUid === authorUid) continue;
    await createUserNotification({
      userUid: f.followerUid,
      type: 'new_release',
      titleAr: 'إصدار جديد من حساب تتابعه',
      titleEn: 'New Release from Someone You Follow',
      messageAr: `أضاف ${authorName} كتاباً جديداً: «${bookTitle}».`,
      messageEn: `${authorName} added a new book: "${bookTitle}".`,
      targetBookId: bookId,
      targetUserUid: authorUid,
      dedupeKey: `new_release:${bookId}:${authorUid}`,
    });
  }
}

async function cleanupOrphanSeriesIfNeeded(seriesId: string | null | undefined): Promise<void> {
  if (!seriesId) return;
  const members = await db
    .select({ id: books.id, partNumber: books.partNumber })
    .from(books)
    .where(eq(books.seriesId, seriesId));
  if (members.length === 1) {
    await db
      .update(books)
      .set({ seriesId: null, seriesTitle: null, partNumber: null })
      .where(eq(books.id, members[0].id));
  }
}

async function resolveAndApplySeriesInput(params: {
  bookId: string;
  bookTitle: string;
  previousSeriesId: string | null;
  seriesId?: string | null;
  seriesTitle?: string | null;
  partNumber?: number | null;
  linkToBookId?: string | null;
  seriesPartOrder?: Array<{ bookId: string; partNumber: number }>;
  restrictToAuthorUid?: string | null;
}): Promise<{
  seriesId: string | null;
  seriesTitle: string | null;
  partNumber: number | null;
}> {
  const cleanLinkTargetId = params.linkToBookId?.trim() || null;
  const explicitSeriesId = params.seriesId === null ? null : params.seriesId?.trim() || undefined;
  const cleanSeriesTitle = params.seriesTitle?.trim() || null;

  let resolvedSeriesId: string | null = null;
  let resolvedSeriesTitle: string | null = null;
  let resolvedPartNumber: number | null = null;

  if (cleanLinkTargetId && cleanLinkTargetId !== params.bookId) {
    const [targetBook] = await db
      .select()
      .from(books)
      .where(eq(books.id, cleanLinkTargetId))
      .limit(1);

    if (targetBook && (!params.restrictToAuthorUid || targetBook.authorUid === params.restrictToAuthorUid)) {
      resolvedSeriesId = targetBook.seriesId?.trim() || `series-${targetBook.id}`;
      resolvedSeriesTitle = cleanSeriesTitle || targetBook.seriesTitle?.trim() || targetBook.title;

      const existingSeriesBooks = await db
        .select({ id: books.id, partNumber: books.partNumber })
        .from(books)
        .where(eq(books.seriesId, resolvedSeriesId));

      const maxExistingPart = existingSeriesBooks.reduce(
        (acc, b) => (b.id !== params.bookId && (b.partNumber ?? 0) > acc ? b.partNumber ?? 0 : acc),
        targetBook.partNumber ?? 1
      );

      if (!targetBook.seriesId || !targetBook.partNumber || (cleanSeriesTitle && targetBook.seriesTitle !== resolvedSeriesTitle)) {
        await db
          .update(books)
          .set({
            seriesId: resolvedSeriesId,
            seriesTitle: resolvedSeriesTitle,
            partNumber: targetBook.partNumber ?? 1,
          })
          .where(eq(books.id, targetBook.id));
      }

      resolvedPartNumber =
        typeof params.partNumber === 'number' && Number.isFinite(params.partNumber) && params.partNumber >= 1
          ? Math.floor(params.partNumber)
          : maxExistingPart + 1;
    }
  } else if (explicitSeriesId) {
    resolvedSeriesId = explicitSeriesId;
    const existingSeriesBooks = await db
      .select({ id: books.id, partNumber: books.partNumber, seriesTitle: books.seriesTitle })
      .from(books)
      .where(eq(books.seriesId, resolvedSeriesId));
    const sampleTitle = existingSeriesBooks.find((b) => b.seriesTitle?.trim())?.seriesTitle?.trim() || null;
    resolvedSeriesTitle = cleanSeriesTitle || sampleTitle || params.bookTitle;
    const maxExistingPart = existingSeriesBooks.reduce(
      (acc, b) => (b.id !== params.bookId && (b.partNumber ?? 0) > acc ? b.partNumber ?? 0 : acc),
      0
    );
    resolvedPartNumber =
      typeof params.partNumber === 'number' && Number.isFinite(params.partNumber) && params.partNumber >= 1
        ? Math.floor(params.partNumber)
        : maxExistingPart + 1;
  } else if (explicitSeriesId === undefined && params.previousSeriesId) {
    // Caller did not pass explicit series fields; preserve existing series state
    const existingRows = await db
      .select({ seriesTitle: books.seriesTitle, partNumber: books.partNumber })
      .from(books)
      .where(eq(books.id, params.bookId))
      .limit(1);
    resolvedSeriesId = params.previousSeriesId;
    resolvedSeriesTitle = cleanSeriesTitle ?? existingRows[0]?.seriesTitle ?? null;
    resolvedPartNumber =
      typeof params.partNumber === 'number' && Number.isFinite(params.partNumber) && params.partNumber >= 1
        ? Math.floor(params.partNumber)
        : existingRows[0]?.partNumber ?? 1;
  }

  // Apply explicit part order across series members when provided
  if (resolvedSeriesId && Array.isArray(params.seriesPartOrder) && params.seriesPartOrder.length > 0) {
    for (const entry of params.seriesPartOrder) {
      if (!entry || typeof entry.bookId !== 'string') continue;
      const cleanPart = Math.max(1, Math.floor(Number(entry.partNumber) || 1));
      if (entry.bookId === params.bookId) {
        resolvedPartNumber = cleanPart;
        continue;
      }
      const whereClause = params.restrictToAuthorUid
        ? and(eq(books.id, entry.bookId), eq(books.authorUid, params.restrictToAuthorUid))
        : eq(books.id, entry.bookId);
      await db
        .update(books)
        .set({
          seriesId: resolvedSeriesId,
          seriesTitle: resolvedSeriesTitle,
          partNumber: cleanPart,
        })
        .where(whereClause);
    }
  } else if (resolvedSeriesId && cleanSeriesTitle) {
    // Propagate updated series title to sibling parts
    const whereClause = params.restrictToAuthorUid
      ? and(eq(books.seriesId, resolvedSeriesId), eq(books.authorUid, params.restrictToAuthorUid))
      : eq(books.seriesId, resolvedSeriesId);
    await db
      .update(books)
      .set({ seriesTitle: resolvedSeriesTitle })
      .where(whereClause);
  }

  return {
    seriesId: resolvedSeriesId,
    seriesTitle: resolvedSeriesTitle,
    partNumber: resolvedPartNumber,
  };
}

export async function devUpsertBook(
  input: {
    id: string;
    title: string;
    subtitle: string;
    author: string;
    authorUid?: string | null;
    isAuthorVerified?: boolean;
    category: string;
    year: number;
    pages: number;
    readingMinutes: number;
    rating?: number;
    version: number;
    updatedAt: string;
    addedAt?: string;
    featured?: boolean;
    isComingSoon?: boolean;
    comingSoonMode?: 'open' | 'date' | 'datetime';
    comingSoonReleaseAt?: string;
    isPremium?: boolean;
    priceLabel?: string;
    tokenPrice?: number | null;
    discountPercent?: number | null;
    discountEndsAt?: string | null;
    discountPostReleaseDays?: number | null;
    unlockCode?: string;
    rotationHours?: number;
    bookType?: 'text' | 'pdf' | 'word';
    pdfId?: string;
    pdfPageCount?: number;
    coverUrl: string;
    synopsis: string;
    chapters: ChapterRow[];
    seriesId?: string | null;
    seriesTitle?: string | null;
    partNumber?: number | null;
    linkToBookId?: string | null;
    seriesPartOrder?: Array<{ bookId: string; partNumber: number }>;
  },
  documentPayload?: {
    id: string;
    fileName: string;
    mimeType: string;
    dataBase64: string;
  },
  options?: {
    notifyFollowers?: boolean;
  }
): Promise<{ ok: boolean; error?: string }> {
  try {
    await ensureCatalogSeeded();
    const now = new Date();
    const farFuture = new Date(now.getTime() + SINGLE_USE_GRANT_FAR_FUTURE_MS);
    const [existing] = await db.select().from(books).where(eq(books.id, input.id));
    const taken = await getTakenCodesSet(input.id);

    const isComingSoon = Boolean(input.isComingSoon);
    const comingSoonMode: 'open' | 'date' | 'datetime' | null = isComingSoon
      ? input.comingSoonMode === 'date' || input.comingSoonMode === 'datetime'
        ? input.comingSoonMode
        : 'open'
      : null;
    const comingSoonReleaseAt: string | null =
      isComingSoon &&
      (comingSoonMode === 'date' || comingSoonMode === 'datetime') &&
      input.comingSoonReleaseAt?.trim()
        ? input.comingSoonReleaseAt.trim()
        : null;
    const isLaunchingNow = Boolean(existing?.isComingSoon) && !isComingSoon;

    const existingHadContent = existing
      ? hasServerBookContent(existing.bookType, existing.pdfId, existing.chaptersJson)
      : false;
    const shouldEnforceContent = isComingSoon || !existing || existingHadContent || isLaunchingNow;
    if (shouldEnforceContent) {
      const contentError = validateReleaseContentRequirement(
        isComingSoon,
        comingSoonMode,
        comingSoonReleaseAt,
        input.bookType ?? 'text',
        input.pdfId,
        input.chapters,
        Boolean(documentPayload)
      );
      if (contentError) {
        return { ok: false, error: contentError };
      }
    }

    const cleanCategory = input.category.trim() || 'عام';
    await db
      .insert(librarySections)
      .values({
        name: cleanCategory,
        sortOrder: 99,
      })
      .onConflictDoNothing();
    const isPremium = Boolean(input.isPremium);
    const rotationHours = Math.max(1, input.rotationHours ?? existing?.rotationHours ?? 24);
    let rotatingCode: string | null = null;
    let codeRotatedAt: Date | null = null;
    let codeExpiresAt: Date | null = null;

    if (isPremium) {
      const suppliedCode = (input.unlockCode ?? '').replace(/\D/g, '');
      if (suppliedCode.length === 10 && !taken.has(suppliedCode)) {
        rotatingCode = suppliedCode;
        const codeChanged = existing?.rotatingCode !== suppliedCode;
        codeRotatedAt = codeChanged ? now : (existing?.codeRotatedAt ?? now);
        codeExpiresAt = farFuture;
      } else if (existing?.rotatingCode) {
        rotatingCode = existing.rotatingCode;
        codeRotatedAt = existing.codeRotatedAt ?? now;
        codeExpiresAt = farFuture;
      } else {
        rotatingCode = generateUniqueTenDigitCode(taken);
        codeRotatedAt = now;
        codeExpiresAt = farFuture;
      }
    }

    let resolvedAuthorUid: string | null =
      input.authorUid !== undefined
        ? input.authorUid?.trim() || null
        : existing?.authorUid ?? null;
    let resolvedAuthorName = input.author.trim();
    let resolvedAuthorVerified = Boolean(input.isAuthorVerified);

    if (resolvedAuthorUid) {
      const [linkedUser] = await db
        .select()
        .from(users)
        .where(eq(users.uid, resolvedAuthorUid))
        .limit(1);
      if (linkedUser) {
        resolvedAuthorUid = linkedUser.uid;
        resolvedAuthorName = linkedUser.displayName || resolvedAuthorName;
        resolvedAuthorVerified = Boolean(linkedUser.isVerified || input.isAuthorVerified);
      } else {
        resolvedAuthorUid = null;
      }
    }

    const resolvedAddedAt = isComingSoon
      ? existing?.addedAt ?? null
      : isLaunchingNow
        ? now.toISOString()
        : existing?.addedAt ?? input.addedAt ?? now.toISOString();

    const hasRealChapters =
      Array.isArray(input.chapters) &&
      input.chapters.some(
        (ch) => Array.isArray(ch.paragraphs) && ch.paragraphs.some((p) => String(p).trim().length > 0)
      );
    const normalizedChapters = hasRealChapters ? input.chapters : [];

    const seriesResolved = await resolveAndApplySeriesInput({
      bookId: input.id,
      bookTitle: input.title,
      previousSeriesId: existing?.seriesId ?? null,
      seriesId: input.seriesId,
      seriesTitle: input.seriesTitle,
      partNumber: input.partNumber,
      linkToBookId: input.linkToBookId,
      seriesPartOrder: input.seriesPartOrder,
    });

    const resolvedTokenPrice: number | null = !isPremium
      ? null
      : input.tokenPrice === null
        ? null
        : typeof input.tokenPrice === 'number' && Number.isFinite(input.tokenPrice) && input.tokenPrice >= 0
          ? Math.min(1_000_000, Math.floor(input.tokenPrice))
          : existing?.tokenPrice ?? null;

    let resolvedDiscountPercent: number | null = existing?.discountPercent ?? null;
    let resolvedDiscountStartedAt: Date | null = existing?.discountStartedAt ?? null;
    let resolvedDiscountEndsAt: Date | null = existing?.discountEndsAt ?? null;
    let resolvedDiscountPostReleaseDays: number | null = existing?.discountPostReleaseDays ?? null;

    if (!isPremium) {
      resolvedDiscountPercent = null;
      resolvedDiscountStartedAt = null;
      resolvedDiscountEndsAt = null;
      resolvedDiscountPostReleaseDays = null;
    } else if (input.discountPercent !== undefined) {
      const pctNum = input.discountPercent === null ? NaN : Number(input.discountPercent);
      if (Number.isFinite(pctNum) && pctNum >= 1 && pctNum <= 99) {
        resolvedDiscountPercent = Math.floor(pctNum);
        resolvedDiscountStartedAt = existing?.discountPercent === resolvedDiscountPercent
          ? existing?.discountStartedAt ?? now
          : now;
        const postDaysNum =
          input.discountPostReleaseDays === null || input.discountPostReleaseDays === undefined
            ? NaN
            : Number(input.discountPostReleaseDays);
        if ((isComingSoon || isLaunchingNow) && Number.isFinite(postDaysNum) && postDaysNum >= 1) {
          resolvedDiscountPostReleaseDays = Math.min(365, Math.floor(postDaysNum));
          resolvedDiscountEndsAt = null;
        } else if (input.discountEndsAt && typeof input.discountEndsAt === 'string' && input.discountEndsAt.trim()) {
          const parsedEnd = new Date(input.discountEndsAt.trim());
          resolvedDiscountEndsAt = !Number.isNaN(parsedEnd.getTime()) ? parsedEnd : null;
          resolvedDiscountPostReleaseDays = null;
        } else {
          resolvedDiscountEndsAt = null;
          resolvedDiscountPostReleaseDays = null;
        }
      } else {
        resolvedDiscountPercent = null;
        resolvedDiscountStartedAt = null;
        resolvedDiscountEndsAt = null;
        resolvedDiscountPostReleaseDays = null;
      }
    }

    if (
      !isComingSoon &&
      resolvedDiscountPercent !== null &&
      resolvedDiscountPostReleaseDays !== null &&
      resolvedDiscountPostReleaseDays >= 1 &&
      !resolvedDiscountEndsAt
    ) {
      resolvedDiscountStartedAt = now;
      resolvedDiscountEndsAt = new Date(
        now.getTime() + resolvedDiscountPostReleaseDays * 24 * 60 * 60 * 1000
      );
      resolvedDiscountPostReleaseDays = null;
    } else if (!isComingSoon) {
      resolvedDiscountPostReleaseDays = null;
    }

    await db
      .insert(books)
      .values({
        id: input.id,
        title: input.title,
        subtitle: input.subtitle,
        author: resolvedAuthorName,
        authorUid: resolvedAuthorUid,
        isAuthorVerified: resolvedAuthorVerified,
        category: cleanCategory,
        year: input.year,
        pages: input.pages,
        readingMinutes: input.readingMinutes,
        rating: existing?.rating ?? 0,
        version: input.version,
        updatedAt: input.updatedAt,
        addedAt: isComingSoon ? null : (input.addedAt ?? now.toISOString()),
        featured: Boolean(input.featured),
        isComingSoon,
        comingSoonMode,
        comingSoonReleaseAt,
        isPremium,
        priceLabel: '',
        tokenPrice: resolvedTokenPrice,
        discountPercent: resolvedDiscountPercent,
        discountStartedAt: resolvedDiscountStartedAt,
        discountEndsAt: resolvedDiscountEndsAt,
        discountPostReleaseDays: resolvedDiscountPostReleaseDays,
        rotatingCode,
        codeRotatedAt,
        codeExpiresAt,
        rotationHours,
        bookType: input.bookType ?? 'text',
        pdfId: input.pdfId ?? null,
        pdfPageCount: input.pdfPageCount ?? null,
        coverUrl: input.coverUrl,
        synopsis: input.synopsis,
        chaptersJson: normalizedChapters,
        reviewStatus: 'approved',
        reviewNote: null,
        seriesId: seriesResolved.seriesId,
        seriesTitle: seriesResolved.seriesTitle,
        partNumber: seriesResolved.partNumber,
      })
      .onConflictDoUpdate({
        target: books.id,
        set: {
          title: input.title,
          subtitle: input.subtitle,
          author: resolvedAuthorName,
          authorUid: resolvedAuthorUid,
          isAuthorVerified: resolvedAuthorVerified,
          category: cleanCategory,
          year: input.year,
          pages: input.pages,
          readingMinutes: input.readingMinutes,
          rating: existing?.rating ?? 0,
          version: input.version,
          updatedAt: input.updatedAt,
          addedAt: resolvedAddedAt,
          featured: Boolean(input.featured),
          isComingSoon,
          comingSoonMode,
          comingSoonReleaseAt,
          isPremium,
          priceLabel: '',
          tokenPrice: resolvedTokenPrice,
          discountPercent: resolvedDiscountPercent,
          discountStartedAt: resolvedDiscountStartedAt,
          discountEndsAt: resolvedDiscountEndsAt,
          discountPostReleaseDays: resolvedDiscountPostReleaseDays,
          rotatingCode,
          codeRotatedAt,
          codeExpiresAt,
          rotationHours,
          bookType: input.bookType ?? 'text',
          pdfId: input.pdfId ?? null,
          pdfPageCount: input.pdfPageCount ?? null,
          coverUrl: input.coverUrl,
          synopsis: input.synopsis,
          chaptersJson: normalizedChapters,
          reviewStatus: 'approved',
          reviewNote: null,
          seriesId: seriesResolved.seriesId,
          seriesTitle: seriesResolved.seriesTitle,
          partNumber: seriesResolved.partNumber,
        },
      });

    if (existing?.seriesId && existing.seriesId !== seriesResolved.seriesId) {
      await cleanupOrphanSeriesIfNeeded(existing.seriesId);
    }

    if (documentPayload) {
      await db
        .insert(bookDocuments)
        .values({
          id: documentPayload.id,
          bookId: input.id,
          fileName: documentPayload.fileName,
          mimeType: documentPayload.mimeType,
          dataBase64: documentPayload.dataBase64,
        })
        .onConflictDoUpdate({
          target: bookDocuments.id,
          set: {
            bookId: input.id,
            fileName: documentPayload.fileName,
            mimeType: documentPayload.mimeType,
            dataBase64: documentPayload.dataBase64,
          },
        });
    }

    if (resolvedAuthorUid && existing?.authorUid !== resolvedAuthorUid) {
      await createUserNotification({
        userUid: resolvedAuthorUid,
        type: 'book_assigned',
        titleAr: 'تم ربط كتاب بحسابك',
        titleEn: 'Book Linked to Your Account',
        messageAr: `أصبح كتاب «${input.title}» منشوراً ومربوطاً بحسابك الآن.`,
        messageEn: `"${input.title}" is now linked to and published under your account.`,
        targetBookId: input.id,
        dedupeKey: `book_assigned:${input.id}`,
      });
    }

    const shouldNotifyFollowers =
      !isComingSoon &&
      Boolean(resolvedAuthorUid) &&
      (options?.notifyFollowers !== undefined
        ? Boolean(options.notifyFollowers)
        : !existing || isLaunchingNow);

    if (isLaunchingNow) {
      await handleBookLaunchedSideEffects({
        bookId: input.id,
        title: input.title,
        authorUid: resolvedAuthorUid,
        authorName: resolvedAuthorName,
        discountPercent: resolvedDiscountPercent,
        discountPostReleaseDays: resolvedDiscountPostReleaseDays,
        discountEndsAt: resolvedDiscountEndsAt,
        now,
        notifyFollowers: shouldNotifyFollowers,
      });
    } else if (shouldNotifyFollowers && resolvedAuthorUid) {
      await notifyFollowersOfNewRelease(
        resolvedAuthorUid,
        resolvedAuthorName,
        input.id,
        input.title
      );
    }

    await bumpCatalogVersion();
    return { ok: true };
  } catch (error) {
    console.error('Database error in devUpsertBook:', error);
    throw new Error('Failed to save book to database.', { cause: error });
  }
}

export async function toggleComingSoonAlert(
  userUid: string,
  bookId: string
): Promise<{ ok: boolean; subscribed?: boolean; subscribersCount?: number; error?: string }> {
  try {
    const [book] = await db.select().from(books).where(eq(books.id, bookId)).limit(1);
    if (!book || book.reviewStatus !== 'approved') {
      return { ok: false, error: 'Book not found.' };
    }
    if (!book.isComingSoon) {
      return { ok: false, error: 'This book is already published.' };
    }

    const [existing] = await db
      .select()
      .from(comingSoonAlerts)
      .where(and(eq(comingSoonAlerts.userUid, userUid), eq(comingSoonAlerts.bookId, bookId)))
      .limit(1);

    let subscribed = false;
    if (existing) {
      await db
        .delete(comingSoonAlerts)
        .where(and(eq(comingSoonAlerts.userUid, userUid), eq(comingSoonAlerts.bookId, bookId)));
      subscribed = false;
    } else {
      await db
        .insert(comingSoonAlerts)
        .values({
          userUid,
          bookId,
        })
        .onConflictDoNothing();
      subscribed = true;
    }

    const allForBook = await db
      .select({ id: comingSoonAlerts.id })
      .from(comingSoonAlerts)
      .where(eq(comingSoonAlerts.bookId, bookId));

    return { ok: true, subscribed, subscribersCount: allForBook.length };
  } catch (error) {
    console.error('Database error in toggleComingSoonAlert:', error);
    throw new Error('Failed to update launch alert subscription.', { cause: error });
  }
}

export async function devDeleteBook(bookId: string): Promise<void> {
  try {
    const [existing] = await db.select().from(books).where(eq(books.id, bookId));
    const pendingPreorders = await db
      .select()
      .from(bookPreorders)
      .where(and(eq(bookPreorders.bookId, bookId), eq(bookPreorders.status, 'pending')));

    if (pendingPreorders.length > 0) {
      await db.transaction(async (tx) => {
        for (const po of pendingPreorders) {
          if (po.tokensPaid > 0) {
            await tx
              .update(users)
              .set({ tokensBalance: sql`${users.tokensBalance} + ${po.tokensPaid}` })
              .where(eq(users.uid, po.userUid));
            await tx.insert(tokenTransactions).values({
              id: `tok-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              userUid: po.userUid,
              amount: po.tokensPaid,
              kind: 'preorder_refund',
              descriptionAr: `استرداد قيمة الطلب المسبق لكتاب «${existing?.title ?? bookId}»`,
              descriptionEn: `Refund for cancelled pre-order of "${existing?.title ?? bookId}"`,
              targetBookId: null,
              dedupeKey: null,
            });
            if (existing?.authorUid && existing.authorUid !== po.userUid) {
              await tx
                .update(users)
                .set({
                  tokensBalance: sql`GREATEST(0, ${users.tokensBalance} - ${po.tokensPaid})`,
                })
                .where(eq(users.uid, existing.authorUid));
            }
          }
        }
      });
      for (const po of pendingPreorders) {
        await createUserNotification({
          userUid: po.userUid,
          type: 'preorder_refunded',
          titleAr: 'تم استرداد عملات الطلب المسبق',
          titleEn: 'Pre-Order Tokens Refunded',
          messageAr: `تم إلغاء إصدار كتاب «${existing?.title ?? bookId}» وأُعيدت ${po.tokensPaid} عملة ذهبية إلى رصيدك.`,
          messageEn: `"${existing?.title ?? bookId}" was removed before release, and ${po.tokensPaid} Golden Tokens have been refunded to your balance.`,
          dedupeKey: `preorder_refunded:${bookId}:${po.userUid}:${Date.now()}`,
        });
      }
    }

    if (existing?.pdfId) {
      await db.delete(bookDocuments).where(eq(bookDocuments.id, existing.pdfId));
    }
    await db.delete(books).where(eq(books.id, bookId));
    if (existing?.seriesId) {
      await cleanupOrphanSeriesIfNeeded(existing.seriesId);
    }
    await bumpCatalogVersion();
  } catch (error) {
    console.error('Database error in devDeleteBook:', error);
    throw new Error('Failed to delete book from database.', { cause: error });
  }
}

export async function userUpsertBookSubmission(
  userUid: string,
  input: {
    id: string;
    title: string;
    subtitle: string;
    category: string;
    year: number;
    pages: number;
    readingMinutes: number;
    version: number;
    updatedAt: string;
    isComingSoon?: boolean;
    comingSoonMode?: 'open' | 'date' | 'datetime';
    comingSoonReleaseAt?: string;
    isPremium?: boolean;
    tokenPrice?: number | null;
    discountPercent?: number | null;
    discountEndsAt?: string | null;
    discountPostReleaseDays?: number | null;
    unlockCode?: string;
    rotationHours?: number;
    bookType?: 'text' | 'pdf' | 'word';
    pdfId?: string;
    pdfPageCount?: number;
    coverUrl: string;
    synopsis: string;
    chapters: ChapterRow[];
    seriesId?: string | null;
    seriesTitle?: string | null;
    partNumber?: number | null;
    linkToBookId?: string | null;
    seriesPartOrder?: Array<{ bookId: string; partNumber: number }>;
  },
  documentPayload?: {
    id: string;
    fileName: string;
    mimeType: string;
    dataBase64: string;
  }
): Promise<{ ok: boolean; error?: string; bookId?: string }> {
  try {
    await ensureCatalogSeeded();
    const [dbUser] = await db.select().from(users).where(eq(users.uid, userUid)).limit(1);
    if (!dbUser) {
      return { ok: false, error: 'User account not found. Please sign in again.' };
    }

    const cleanTitle = (input.title ?? '').trim();
    if (!cleanTitle) {
      return { ok: false, error: 'Book title is required.' };
    }
    const cleanCoverUrl = (input.coverUrl ?? '').trim();
    if (!cleanCoverUrl) {
      return { ok: false, error: 'Book cover image is required.' };
    }

    const [existing] = await db.select().from(books).where(eq(books.id, input.id)).limit(1);
    if (existing) {
      if (existing.authorUid !== dbUser.uid) {
        return { ok: false, error: 'You do not have permission to edit this book.' };
      }
      if (existing.reviewStatus === 'approved' && !existing.isComingSoon) {
        return {
          ok: false,
          error: 'Approved published books cannot be modified from the submission studio.',
        };
      }
    }

    const isComingSoon = Boolean(input.isComingSoon);
    const comingSoonMode: 'open' | 'date' | 'datetime' | null = isComingSoon
      ? input.comingSoonMode === 'date' || input.comingSoonMode === 'datetime'
        ? input.comingSoonMode
        : 'open'
      : null;
    const comingSoonReleaseAt: string | null =
      isComingSoon &&
      (comingSoonMode === 'date' || comingSoonMode === 'datetime') &&
      input.comingSoonReleaseAt?.trim()
        ? input.comingSoonReleaseAt.trim()
        : null;

    const bookType: 'text' | 'pdf' | 'word' =
      input.bookType === 'pdf' || input.bookType === 'word' ? input.bookType : 'text';

    const contentError = validateReleaseContentRequirement(
      isComingSoon,
      comingSoonMode,
      comingSoonReleaseAt,
      bookType,
      input.pdfId,
      input.chapters,
      Boolean(documentPayload)
    );
    if (contentError) {
      return { ok: false, error: contentError };
    }

    const taken = await getTakenCodesSet(input.id);
    const now = new Date();
    const farFuture = new Date(now.getTime() + SINGLE_USE_GRANT_FAR_FUTURE_MS);

    const cleanCategory = input.category.trim() || 'عام';
    await db
      .insert(librarySections)
      .values({
        name: cleanCategory,
        sortOrder: 99,
      })
      .onConflictDoNothing();

    const isPremium = Boolean(input.isPremium);
    const rotationHours = Math.max(1, input.rotationHours ?? existing?.rotationHours ?? 24);
    let rotatingCode: string | null = null;
    let codeRotatedAt: Date | null = null;
    let codeExpiresAt: Date | null = null;

    if (isPremium) {
      const rawSupplied = (input.unlockCode ?? '').trim();
      if (rawSupplied) {
        const cleanCode = rawSupplied.replace(/\D/g, '');
        if (cleanCode.length !== 10) {
          return { ok: false, error: 'Premium unlock code must be exactly 10 digits.' };
        }
        if (taken.has(cleanCode)) {
          return { ok: false, error: 'This 10-digit code is already used by another book or theme.' };
        }
        rotatingCode = cleanCode;
        const codeChanged = existing?.rotatingCode !== cleanCode;
        codeRotatedAt = codeChanged ? now : (existing?.codeRotatedAt ?? now);
        codeExpiresAt = farFuture;
      } else if (existing?.rotatingCode) {
        rotatingCode = existing.rotatingCode;
        codeRotatedAt = existing.codeRotatedAt ?? now;
        codeExpiresAt = farFuture;
      } else {
        rotatingCode = generateUniqueTenDigitCode(taken);
        codeRotatedAt = now;
        codeExpiresAt = farFuture;
      }
    }

    const resolvedAuthorName = (dbUser.displayName || dbUser.email || 'Reader').trim();
    const resolvedAuthorVerified = Boolean(dbUser.isVerified);
    const hasTextChapters =
      Array.isArray(input.chapters) &&
      input.chapters.some(
        (ch) => Array.isArray(ch.paragraphs) && ch.paragraphs.some((p) => String(p).trim().length > 0)
      );
    const normalizedChapters = hasTextChapters ? input.chapters : [];
    const hasAnyContent = hasServerBookContent(
      bookType,
      input.pdfId,
      normalizedChapters,
      Boolean(documentPayload)
    );
    const resolvedPages = hasAnyContent ? Math.max(1, Number(input.pages) || 1) : 0;

    const economy = await getTokenEconomyConfig();
    const requiredPublishCost = isPremium
      ? economy.publishPremiumBookCost
      : economy.publishRegularBookCost;
    const alreadyPaidTokens = existing?.publishTokensPaid ?? 0;
    const deltaPublishCost = Math.max(0, requiredPublishCost - alreadyPaidTokens);

    if (deltaPublishCost > 0) {
      const debitRes = await debitUserTokens({
        userUid: dbUser.uid,
        amount: deltaPublishCost,
        kind: isPremium ? 'publish_premium_book' : 'publish_regular_book',
        descriptionAr: isPremium
          ? `رسوم نشر كتاب بريميوم «${cleanTitle}»`
          : `رسوم نشر كتاب عادي «${cleanTitle}»`,
        descriptionEn: isPremium
          ? `Publishing fee for premium book "${cleanTitle}"`
          : `Publishing fee for regular book "${cleanTitle}"`,
        targetBookId: input.id,
      });
      if (!debitRes.ok) {
        return { ok: false, error: debitRes.error };
      }
    }

    const totalPublishTokensPaid = Math.max(alreadyPaidTokens, requiredPublishCost);

    const seriesResolved = await resolveAndApplySeriesInput({
      bookId: input.id,
      bookTitle: cleanTitle,
      previousSeriesId: existing?.seriesId ?? null,
      seriesId: input.seriesId,
      seriesTitle: input.seriesTitle,
      partNumber: input.partNumber,
      linkToBookId: input.linkToBookId,
      seriesPartOrder: input.seriesPartOrder,
      restrictToAuthorUid: dbUser.uid,
    });

    const resolvedTokenPrice = !isPremium
      ? null
      : input.tokenPrice === null
        ? null
        : typeof input.tokenPrice === 'number' &&
            Number.isFinite(input.tokenPrice) &&
            input.tokenPrice >= 0
          ? Math.min(1_000_000, Math.floor(input.tokenPrice))
          : existing?.tokenPrice ?? null;

    let resolvedDiscountPercent: number | null = existing?.discountPercent ?? null;
    let resolvedDiscountStartedAt: Date | null = existing?.discountStartedAt ?? null;
    let resolvedDiscountEndsAt: Date | null = existing?.discountEndsAt ?? null;
    let resolvedDiscountPostReleaseDays: number | null = existing?.discountPostReleaseDays ?? null;

    if (!isPremium) {
      resolvedDiscountPercent = null;
      resolvedDiscountStartedAt = null;
      resolvedDiscountEndsAt = null;
      resolvedDiscountPostReleaseDays = null;
    } else if (input.discountPercent !== undefined) {
      const pctNum = input.discountPercent === null ? NaN : Number(input.discountPercent);
      if (Number.isFinite(pctNum) && pctNum >= 1 && pctNum <= 99) {
        resolvedDiscountPercent = Math.floor(pctNum);
        resolvedDiscountStartedAt =
          existing?.discountPercent === resolvedDiscountPercent
            ? existing?.discountStartedAt ?? now
            : now;
        const postDaysNum =
          input.discountPostReleaseDays === null || input.discountPostReleaseDays === undefined
            ? NaN
            : Number(input.discountPostReleaseDays);
        if (isComingSoon && Number.isFinite(postDaysNum) && postDaysNum >= 1) {
          resolvedDiscountPostReleaseDays = Math.min(365, Math.floor(postDaysNum));
          resolvedDiscountEndsAt = null;
        } else if (
          input.discountEndsAt &&
          typeof input.discountEndsAt === 'string' &&
          input.discountEndsAt.trim()
        ) {
          const parsedEnd = new Date(input.discountEndsAt.trim());
          resolvedDiscountEndsAt =
            !Number.isNaN(parsedEnd.getTime()) && parsedEnd.getTime() > now.getTime()
              ? parsedEnd
              : null;
          resolvedDiscountPostReleaseDays = null;
        } else {
          resolvedDiscountEndsAt = null;
          resolvedDiscountPostReleaseDays = null;
        }
      } else {
        resolvedDiscountPercent = null;
        resolvedDiscountStartedAt = null;
        resolvedDiscountEndsAt = null;
        resolvedDiscountPostReleaseDays = null;
      }
    }

    await db
      .insert(books)
      .values({
        id: input.id,
        title: cleanTitle,
        subtitle: (input.subtitle ?? '').trim(),
        author: resolvedAuthorName,
        authorUid: dbUser.uid,
        isAuthorVerified: resolvedAuthorVerified,
        category: cleanCategory,
        year: Number(input.year) || now.getFullYear(),
        pages: resolvedPages,
        readingMinutes: hasAnyContent ? Math.max(1, Number(input.readingMinutes) || 1) : 0,
        rating: existing?.rating ?? 0,
        version: Math.max(1, Number(input.version) || 1),
        updatedAt: input.updatedAt || now.toISOString().slice(0, 10),
        addedAt: null,
        featured: false,
        isComingSoon,
        comingSoonMode,
        comingSoonReleaseAt,
        isPremium,
        priceLabel: '',
        tokenPrice: resolvedTokenPrice,
        discountPercent: resolvedDiscountPercent,
        discountStartedAt: resolvedDiscountStartedAt,
        discountEndsAt: resolvedDiscountEndsAt,
        discountPostReleaseDays: resolvedDiscountPostReleaseDays,
        pendingTokenPrice: null,
        priceReviewStatus: null,
        priceReviewNote: null,
        priceSubmittedAt: null,
        publishTokensPaid: totalPublishTokensPaid,
        rotatingCode,
        codeRotatedAt,
        codeExpiresAt,
        rotationHours,
        bookType,
        pdfId: input.pdfId ?? null,
        pdfPageCount: input.pdfPageCount ?? null,
        coverUrl: cleanCoverUrl,
        synopsis: (input.synopsis ?? '').trim(),
        chaptersJson: normalizedChapters,
        reviewStatus: 'pending',
        reviewNote: null,
        submittedAt: now,
        seriesId: seriesResolved.seriesId,
        seriesTitle: seriesResolved.seriesTitle,
        partNumber: seriesResolved.partNumber,
      })
      .onConflictDoUpdate({
        target: books.id,
        set: {
          title: cleanTitle,
          subtitle: (input.subtitle ?? '').trim(),
          author: resolvedAuthorName,
          authorUid: dbUser.uid,
          isAuthorVerified: resolvedAuthorVerified,
          category: cleanCategory,
          year: Number(input.year) || now.getFullYear(),
          pages: resolvedPages,
          readingMinutes: hasAnyContent ? Math.max(1, Number(input.readingMinutes) || 1) : 0,
          version: (existing?.version ?? 1) + 1,
          updatedAt: input.updatedAt || now.toISOString().slice(0, 10),
          addedAt: null,
          featured: false,
          isComingSoon,
          comingSoonMode,
          comingSoonReleaseAt,
          isPremium,
          priceLabel: '',
          tokenPrice: resolvedTokenPrice,
          discountPercent: resolvedDiscountPercent,
          discountStartedAt: resolvedDiscountStartedAt,
          discountEndsAt: resolvedDiscountEndsAt,
          discountPostReleaseDays: resolvedDiscountPostReleaseDays,
          pendingTokenPrice: null,
          priceReviewStatus: null,
          priceReviewNote: null,
          priceSubmittedAt: null,
          publishTokensPaid: totalPublishTokensPaid,
          rotatingCode,
          codeRotatedAt,
          codeExpiresAt,
          rotationHours,
          bookType,
          pdfId: input.pdfId ?? null,
          pdfPageCount: input.pdfPageCount ?? null,
          coverUrl: cleanCoverUrl,
          synopsis: (input.synopsis ?? '').trim(),
          chaptersJson: normalizedChapters,
          reviewStatus: 'pending',
          reviewNote: null,
          submittedAt: now,
          seriesId: seriesResolved.seriesId,
          seriesTitle: seriesResolved.seriesTitle,
          partNumber: seriesResolved.partNumber,
        },
      });

    if (existing?.seriesId && existing.seriesId !== seriesResolved.seriesId) {
      await cleanupOrphanSeriesIfNeeded(existing.seriesId);
    }

    if (documentPayload) {
      await db
        .insert(bookDocuments)
        .values({
          id: documentPayload.id,
          bookId: input.id,
          fileName: documentPayload.fileName,
          mimeType: documentPayload.mimeType,
          dataBase64: documentPayload.dataBase64,
        })
        .onConflictDoUpdate({
          target: bookDocuments.id,
          set: {
            bookId: input.id,
            fileName: documentPayload.fileName,
            mimeType: documentPayload.mimeType,
            dataBase64: documentPayload.dataBase64,
          },
        });
    }

    await bumpCatalogVersion();
    return { ok: true, bookId: input.id };
  } catch (error) {
    console.error('Database error in userUpsertBookSubmission:', error);
    throw new Error('Failed to submit book for review.', { cause: error });
  }
}

export async function userDeleteBookSubmission(
  userUid: string,
  bookId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const [existing] = await db.select().from(books).where(eq(books.id, bookId)).limit(1);
    if (!existing) {
      return { ok: false, error: 'Book submission not found.' };
    }
    if (existing.authorUid !== userUid) {
      return { ok: false, error: 'Forbidden: you do not own this submission.' };
    }
    if (existing.reviewStatus === 'approved') {
      return { ok: false, error: 'Approved published books cannot be deleted from your profile.' };
    }
    if (existing.pdfId) {
      await db.delete(bookDocuments).where(eq(bookDocuments.id, existing.pdfId));
    }
    await db.delete(books).where(eq(books.id, bookId));
    if (existing.seriesId) {
      await cleanupOrphanSeriesIfNeeded(existing.seriesId);
    }
    await bumpCatalogVersion();
    return { ok: true };
  } catch (error) {
    console.error('Database error in userDeleteBookSubmission:', error);
    throw new Error('Failed to delete book submission.', { cause: error });
  }
}

export async function devListPendingSubmissions(): Promise<ServerBookDTO[]> {
  try {
    const [pendingRows, allUsersRows, allFollowRows, economyConfig] = await Promise.all([
      db
        .select()
        .from(books)
        .where(eq(books.reviewStatus, 'pending'))
        .orderBy(desc(books.submittedAt), desc(books.createdAt)),
      db
        .select({
          uid: users.uid,
          displayName: users.displayName,
          isVerified: users.isVerified,
        })
        .from(users),
      db.select().from(userFollows),
      getTokenEconomyConfig(),
    ]);

    const usersByUid = new Map(allUsersRows.map((u) => [u.uid, u]));
    const followersCountMap = new Map<string, number>();
    for (const f of allFollowRows) {
      followersCountMap.set(f.targetUid, (followersCountMap.get(f.targetUid) ?? 0) + 1);
    }

    return pendingRows.map((b) => {
      const linkedUser = b.authorUid ? usersByUid.get(b.authorUid) : undefined;
      const authorName = linkedUser ? linkedUser.displayName : b.author;
      const isComingSoon = Boolean(b.isComingSoon);
      return {
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        author: authorName,
        authorUid: linkedUser ? linkedUser.uid : b.authorUid ?? null,
        authorAccount: linkedUser
          ? {
              uid: linkedUser.uid,
              displayName: linkedUser.displayName,
              isVerified: Boolean(linkedUser.isVerified),
              followersCount: followersCountMap.get(linkedUser.uid) ?? 0,
              isFollowing: false,
            }
          : null,
        isAuthorVerified: linkedUser
          ? Boolean(linkedUser.isVerified || b.isAuthorVerified)
          : Boolean(b.isAuthorVerified),
        category: b.category,
        year: b.year,
        pages: b.pages,
        readingMinutes: b.readingMinutes,
        rating: 0,
        reviews: [],
        version: b.version,
        updatedAt: b.updatedAt,
        addedAt: b.addedAt ?? undefined,
        featured: Boolean(b.featured),
        isComingSoon,
        comingSoonMode:
          isComingSoon &&
          (b.comingSoonMode === 'date' || b.comingSoonMode === 'datetime' || b.comingSoonMode === 'open')
            ? b.comingSoonMode
            : isComingSoon
              ? 'open'
              : undefined,
        comingSoonReleaseAt:
          isComingSoon && b.comingSoonReleaseAt ? b.comingSoonReleaseAt : undefined,
        isNotifySubscribed: false,
        notifySubscribersCount: 0,
        isPreordered: false,
        preordersCount: 0,
        isPremium: Boolean(b.isPremium),
        priceLabel: b.priceLabel,
        tokenPrice: b.tokenPrice ?? null,
        baseTokenPrice: getBookSalePricing(b, economyConfig).baseTokenPrice,
        effectiveTokenPrice: resolveEffectiveBookTokenPrice(b, economyConfig),
        discountPercent: getBookSalePricing(b, economyConfig).discountPercent,
        discountStartedAt: getBookSalePricing(b, economyConfig).discountStartedAt,
        discountEndsAt: getBookSalePricing(b, economyConfig).discountEndsAt,
        discountPostReleaseDays: getBookSalePricing(b, economyConfig).discountPostReleaseDays,
        publishTokensPaid: b.publishTokensPaid ?? 0,
        rotationHours: b.rotationHours,
        accessType: b.isPremium ? 'code' : 'free',
        isUnlocked: true,
        bookType: (b.bookType as 'text' | 'pdf' | 'word') || 'text',
        pdfId: b.pdfId ?? undefined,
        pdfPageCount: b.pdfPageCount ?? undefined,
        coverUrl: b.coverUrl,
        synopsis: b.synopsis,
        chapters: b.chaptersJson ?? [],
        reviewStatus: 'pending',
        reviewNote: b.reviewNote ?? null,
        submittedAt: b.submittedAt ? b.submittedAt.toISOString() : b.createdAt.toISOString(),
        seriesId: b.seriesId ?? null,
        seriesTitle: b.seriesTitle ?? null,
        partNumber: b.partNumber ?? null,
      };
    });
  } catch (error) {
    console.error('Database error in devListPendingSubmissions:', error);
    throw new Error('Failed to load pending book submissions.', { cause: error });
  }
}

export async function devReviewBookSubmission(
  bookId: string,
  decision: 'approve' | 'reject',
  reviewNote?: string
): Promise<{ ok: boolean; error?: string; status?: 'approved' | 'rejected' }> {
  try {
    const [targetBook] = await db.select().from(books).where(eq(books.id, bookId)).limit(1);
    if (!targetBook) {
      return { ok: false, error: 'Book submission not found.' };
    }

    const now = new Date();
    const authorUser = targetBook.authorUid
      ? (await db.select().from(users).where(eq(users.uid, targetBook.authorUid)).limit(1))[0]
      : undefined;
    const authorName = authorUser?.displayName || targetBook.author;
    const authorVerified = authorUser ? Boolean(authorUser.isVerified) : Boolean(targetBook.isAuthorVerified);

    if (decision === 'approve') {
      await db
        .update(books)
        .set({
          reviewStatus: 'approved',
          reviewNote: null,
          author: authorName,
          isAuthorVerified: authorVerified,
          addedAt: targetBook.isComingSoon ? null : now.toISOString(),
          updatedAt: now.toISOString().slice(0, 10),
        })
        .where(eq(books.id, bookId));

      if (targetBook.authorUid) {
        await createUserNotification({
          userUid: targetBook.authorUid,
          type: 'book_submission_approved',
          titleAr: 'تمت الموافقة على نشر كتابك!',
          titleEn: 'Your Book Submission Was Approved!',
          messageAr: targetBook.isComingSoon
            ? `وافق المطور على نشر كتابك «${targetBook.title}» ضمن قائمة «قريباً» وأصبح ظاهراً الآن لجميع القراء.`
            : `وافق المطور على كتابك «${targetBook.title}» وتم نشره الآن في المكتبة لجميع القراء!`,
          messageEn: targetBook.isComingSoon
            ? `Your book "${targetBook.title}" was approved and is now visible in the Coming Soon showcase for all readers!`
            : `Your book "${targetBook.title}" has been approved and is now published live in the library!`,
          targetBookId: targetBook.id,
          targetView: 'catalog',
          dedupeKey: `submission_approved:${targetBook.id}:${now.getTime()}`,
        });

        const economy = await getTokenEconomyConfig();
        if (economy.rewardBookApproved > 0) {
          await creditUserTokens({
            userUid: targetBook.authorUid,
            amount: economy.rewardBookApproved,
            kind: 'reward_book_approved',
            descriptionAr: `مكافأة الموافقة على نشر كتاب «${targetBook.title}»`,
            descriptionEn: `Reward for book "${targetBook.title}" being approved`,
            targetBookId: targetBook.id,
            dedupeKey: `reward:book_approved:${targetBook.id}`,
          });
        }
      }

      if (!targetBook.isComingSoon) {
        await handleBookLaunchedSideEffects({
          bookId: targetBook.id,
          title: targetBook.title,
          authorUid: targetBook.authorUid ?? null,
          authorName,
          discountPercent: targetBook.discountPercent,
          discountPostReleaseDays: targetBook.discountPostReleaseDays,
          discountEndsAt: targetBook.discountEndsAt,
          now,
          notifyFollowers: Boolean(targetBook.authorUid),
        });
      }

      await bumpCatalogVersion();
      return { ok: true, status: 'approved' };
    }

    const cleanNote = (reviewNote ?? '').trim() || null;
    await db
      .update(books)
      .set({
        reviewStatus: 'rejected',
        reviewNote: cleanNote,
      })
      .where(eq(books.id, bookId));

    if (targetBook.authorUid) {
      await createUserNotification({
        userUid: targetBook.authorUid,
        type: 'book_submission_rejected',
        titleAr: 'تم رفض طلب نشر كتابك',
        titleEn: 'Book Submission Not Approved',
        messageAr: cleanNote
          ? `عذراً، لم تتم الموافقة على نشر كتاب «${targetBook.title}». سبب المطور: ${cleanNote}. يمكنك تعديله وإعادة إرساله من ملفك الشخصي.`
          : `عذراً، لم تتم الموافقة على نشر كتاب «${targetBook.title}» في الوقت الحالي. يمكنك تعديله وإعادة إرساله من ملفك الشخصي.`,
        messageEn: cleanNote
          ? `Sorry, your book "${targetBook.title}" was not approved. Note: ${cleanNote}. You can edit and resubmit it from your Profile.`
          : `Sorry, your book "${targetBook.title}" was not approved right now. You can edit and resubmit it from your Profile.`,
        targetBookId: targetBook.id,
        targetView: 'you',
        targetSection: 'publish-studio',
        dedupeKey: `submission_rejected:${targetBook.id}:${now.getTime()}`,
      });
    }

    await bumpCatalogVersion();
    return { ok: true, status: 'rejected' };
  } catch (error) {
    console.error('Database error in devReviewBookSubmission:', error);
    throw new Error('Failed to review book submission.', { cause: error });
  }
}

export async function userRequestBookPriceChange(
  userUid: string,
  bookId: string,
  newTokenPrice: number
): Promise<{ ok: boolean; error?: string }> {
  try {
    await ensureCatalogSeeded();
    const [dbUser, existingRows, economyConfig] = await Promise.all([
      db.select().from(users).where(eq(users.uid, userUid)).limit(1),
      db.select().from(books).where(eq(books.id, bookId)).limit(1),
      getTokenEconomyConfig(),
    ]);
    if (!dbUser[0]) {
      return { ok: false, error: 'User account not found. Please sign in again.' };
    }
    const existing = existingRows[0];
    if (!existing) {
      return { ok: false, error: 'Book not found.' };
    }
    if (existing.authorUid !== userUid) {
      return { ok: false, error: 'Forbidden: only the book owner can change its price.' };
    }
    if (!existing.isPremium) {
      return { ok: false, error: 'Only premium books can have a Golden Token price.' };
    }
    if (existing.reviewStatus !== 'approved') {
      return {
        ok: false,
        error: 'Pending or rejected books can update their price directly in the submission form.',
      };
    }

    const parsed = Number(newTokenPrice);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { ok: false, error: 'Please enter a valid non-negative integer price.' };
    }
    const cleanPrice = Math.min(1_000_000, Math.floor(parsed));
    const currentEffective = resolveEffectiveBookTokenPrice(existing, economyConfig);
    if (existing.tokenPrice !== null && existing.tokenPrice !== undefined && cleanPrice === currentEffective) {
      return { ok: false, error: 'The new price is already the active price for this book.' };
    }

    await db
      .update(books)
      .set({
        pendingTokenPrice: cleanPrice,
        priceReviewStatus: 'pending',
        priceReviewNote: null,
        priceSubmittedAt: new Date(),
      })
      .where(eq(books.id, bookId));

    await bumpCatalogVersion();
    return { ok: true };
  } catch (error) {
    console.error('Database error in userRequestBookPriceChange:', error);
    throw new Error('Failed to submit price change request.', { cause: error });
  }
}

export async function userUpdateBookDiscount(
  userUid: string,
  bookId: string,
  input: {
    discountPercent: number | null;
    discountEndsAt?: string | null;
    discountPostReleaseDays?: number | null;
  }
): Promise<{ ok: boolean; error?: string }> {
  try {
    await ensureCatalogSeeded();
    const [dbUser, existingRows] = await Promise.all([
      db.select({ uid: users.uid }).from(users).where(eq(users.uid, userUid)).limit(1),
      db.select().from(books).where(eq(books.id, bookId)).limit(1),
    ]);
    if (!dbUser[0]) {
      return { ok: false, error: 'يرجى تسجيل الدخول بحساب Google أولاً.' };
    }
    const existing = existingRows[0];
    if (!existing) {
      return { ok: false, error: 'الكتاب غير موجود.' };
    }
    if (existing.authorUid !== userUid) {
      return { ok: false, error: 'Forbidden: فقط صاحب الكتاب يمكنه تعديل الخصم.' };
    }
    if (!existing.isPremium) {
      return { ok: false, error: 'الخصومات متاحة للكتب البريميوم فقط.' };
    }
    if (existing.reviewStatus !== 'approved') {
      return { ok: false, error: 'يمكن تفعيل الخصم بعد اعتماد ونشر الكتاب.' };
    }

    const rawPct = input.discountPercent;
    if (rawPct === null || rawPct === undefined || Number(rawPct) === 0) {
      await db
        .update(books)
        .set({
          discountPercent: null,
          discountStartedAt: null,
          discountEndsAt: null,
          discountPostReleaseDays: null,
        })
        .where(eq(books.id, bookId));
      await bumpCatalogVersion();
      return { ok: true };
    }

    const parsedPct = Math.floor(Number(rawPct));
    if (!Number.isFinite(parsedPct) || parsedPct < 1 || parsedPct > 99) {
      return { ok: false, error: 'يرجى اختيار نسبة خصم صحيحة بين 1% و 99%.' };
    }

    let resolvedEndsAt: Date | null = null;
    let resolvedPostReleaseDays: number | null = null;

    if (
      existing.isComingSoon &&
      input.discountPostReleaseDays !== null &&
      input.discountPostReleaseDays !== undefined
    ) {
      const parsedDays = Math.floor(Number(input.discountPostReleaseDays));
      if (!Number.isFinite(parsedDays) || parsedDays < 1 || parsedDays > 365) {
        return { ok: false, error: 'يرجى تحديد مدة صالحة بعد النشر بين يوم و365 يوماً.' };
      }
      resolvedPostReleaseDays = parsedDays;
      resolvedEndsAt = null;
    } else if (typeof input.discountEndsAt === 'string' && input.discountEndsAt.trim()) {
      const parsedEnd = new Date(input.discountEndsAt.trim());
      if (Number.isNaN(parsedEnd.getTime()) || parsedEnd.getTime() <= Date.now()) {
        return { ok: false, error: 'يجب أن يكون موعد انتهاء العرض في المستقبل.' };
      }
      resolvedEndsAt = parsedEnd;
      resolvedPostReleaseDays = null;
    }

    await db
      .update(books)
      .set({
        discountPercent: parsedPct,
        discountStartedAt: new Date(),
        discountEndsAt: resolvedEndsAt,
        discountPostReleaseDays: resolvedPostReleaseDays,
      })
      .where(eq(books.id, bookId));

    await bumpCatalogVersion();
    return { ok: true };
  } catch (error) {
    console.error('Database error in userUpdateBookDiscount:', error);
    throw new Error('Failed to update book discount.', { cause: error });
  }
}

export async function devListPendingPriceRequests(): Promise<PendingPriceRequestDTO[]> {
  try {
    const [pendingRows, allUsersRows, economyConfig] = await Promise.all([
      db
        .select()
        .from(books)
        .where(eq(books.priceReviewStatus, 'pending'))
        .orderBy(desc(books.priceSubmittedAt), desc(books.createdAt)),
      db
        .select({
          uid: users.uid,
          displayName: users.displayName,
          isVerified: users.isVerified,
        })
        .from(users),
      getTokenEconomyConfig(),
    ]);

    const usersByUid = new Map(allUsersRows.map((u) => [u.uid, u]));

    return pendingRows
      .filter((b) => typeof b.pendingTokenPrice === 'number')
      .map((b) => {
        const linkedUser = b.authorUid ? usersByUid.get(b.authorUid) : undefined;
        return {
          bookId: b.id,
          title: b.title,
          coverUrl: b.coverUrl,
          author: linkedUser ? linkedUser.displayName : b.author,
          authorUid: linkedUser ? linkedUser.uid : b.authorUid ?? null,
          isAuthorVerified: linkedUser
            ? Boolean(linkedUser.isVerified || b.isAuthorVerified)
            : Boolean(b.isAuthorVerified),
          currentTokenPrice: b.tokenPrice ?? null,
          effectiveCurrentPrice: resolveEffectiveBookTokenPrice(b, economyConfig),
          proposedTokenPrice: b.pendingTokenPrice as number,
          submittedAt: b.priceSubmittedAt ? b.priceSubmittedAt.toISOString() : null,
        };
      });
  } catch (error) {
    console.error('Database error in devListPendingPriceRequests:', error);
    throw new Error('Failed to load pending price change requests.', { cause: error });
  }
}

export async function devReviewBookPriceRequest(
  bookId: string,
  decision: 'approve' | 'reject',
  reviewNote?: string
): Promise<{ ok: boolean; error?: string; status?: 'approved' | 'rejected' }> {
  try {
    const [targetBook] = await db.select().from(books).where(eq(books.id, bookId)).limit(1);
    if (!targetBook) {
      return { ok: false, error: 'Book not found.' };
    }
    if (
      targetBook.priceReviewStatus !== 'pending' ||
      typeof targetBook.pendingTokenPrice !== 'number'
    ) {
      return { ok: false, error: 'No pending price change request found for this book.' };
    }

    const now = new Date();
    const proposedPrice = targetBook.pendingTokenPrice;

    if (decision === 'approve') {
      await db
        .update(books)
        .set({
          tokenPrice: proposedPrice,
          pendingTokenPrice: null,
          priceReviewStatus: null,
          priceReviewNote: null,
          priceSubmittedAt: null,
        })
        .where(eq(books.id, bookId));

      if (targetBook.authorUid) {
        await createUserNotification({
          userUid: targetBook.authorUid,
          type: 'price_request_approved',
          titleAr: 'تمت الموافقة على تعديل سعر كتابك!',
          titleEn: 'Your Book Price Update Was Approved!',
          messageAr: `وافق المطور على السعر الجديد (${proposedPrice}) لكتابك «${targetBook.title}» وأصبح مفعّلاً الآن.`,
          messageEn: `The developer approved the new price (${proposedPrice}) for your book "${targetBook.title}" and it is now live.`,
          targetBookId: targetBook.id,
          dedupeKey: `price_approved:${targetBook.id}:${now.getTime()}`,
        });
      }

      await bumpCatalogVersion();
      return { ok: true, status: 'approved' };
    }

    const cleanNote = (reviewNote ?? '').trim() || null;
    await db
      .update(books)
      .set({
        pendingTokenPrice: null,
        priceReviewStatus: 'rejected',
        priceReviewNote: cleanNote,
        priceSubmittedAt: null,
      })
      .where(eq(books.id, bookId));

    if (targetBook.authorUid) {
      await createUserNotification({
        userUid: targetBook.authorUid,
        type: 'price_request_rejected',
        titleAr: 'تم رفض طلب تعديل سعر كتابك',
        titleEn: 'Book Price Update Not Approved',
        messageAr: cleanNote
          ? `عذراً، لم يوافق المطور على السعر الجديد (${proposedPrice}) لكتاب «${targetBook.title}». السبب: ${cleanNote}`
          : `عذراً، لم يوافق المطور على طلب تعديل سعر كتاب «${targetBook.title}» إلى ${proposedPrice}.`,
        messageEn: cleanNote
          ? `Sorry, your price change request (${proposedPrice}) for "${targetBook.title}" was declined. Note: ${cleanNote}`
          : `Sorry, your price change request (${proposedPrice}) for "${targetBook.title}" was declined.`,
        targetBookId: targetBook.id,
        dedupeKey: `price_rejected:${targetBook.id}:${now.getTime()}`,
      });
    }

    await bumpCatalogVersion();
    return { ok: true, status: 'rejected' };
  } catch (error) {
    console.error('Database error in devReviewBookPriceRequest:', error);
    throw new Error('Failed to review book price request.', { cause: error });
  }
}

export async function devSetBookAuthorVerified(
  bookId: string,
  isAuthorVerified: boolean
): Promise<void> {
  try {
    await db
      .update(books)
      .set({ isAuthorVerified: Boolean(isAuthorVerified) })
      .where(eq(books.id, bookId));
    await bumpCatalogVersion();
  } catch (error) {
    console.error('Database error in devSetBookAuthorVerified:', error);
    throw new Error('Failed to update author verification status.', { cause: error });
  }
}

export async function devAssignBookOwner(
  bookId: string,
  authorUid: string | null,
  notifyFollowers = false
): Promise<{ ok: boolean; error?: string }> {
  try {
    const cleanUid = authorUid?.trim() || null;
    if (!cleanUid) {
      await db.update(books).set({ authorUid: null }).where(eq(books.id, bookId));
      await bumpCatalogVersion();
      return { ok: true };
    }
    const [targetBook] = await db
      .select({ id: books.id, title: books.title, authorUid: books.authorUid })
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);
    const [targetUser] = await db.select().from(users).where(eq(users.uid, cleanUid)).limit(1);
    if (!targetUser) {
      return { ok: false, error: 'Selected user account was not found.' };
    }
    await db
      .update(books)
      .set({
        authorUid: targetUser.uid,
        author: targetUser.displayName,
        isAuthorVerified: Boolean(targetUser.isVerified),
      })
      .where(eq(books.id, bookId));

    if (targetBook && targetBook.authorUid !== targetUser.uid) {
      await createUserNotification({
        userUid: targetUser.uid,
        type: 'book_assigned',
        titleAr: 'تم ربط كتاب بحسابك',
        titleEn: 'Book Linked to Your Account',
        messageAr: `أصبح كتاب «${targetBook.title}» منشوراً ومربوطاً بحسابك الآن.`,
        messageEn: `"${targetBook.title}" is now linked to and published under your account.`,
        targetBookId: bookId,
        dedupeKey: `book_assigned:${bookId}`,
      });
    }

    if (notifyFollowers && targetBook && targetBook.authorUid !== targetUser.uid) {
      await notifyFollowersOfNewRelease(
        targetUser.uid,
        targetUser.displayName,
        bookId,
        targetBook.title
      );
    }

    await bumpCatalogVersion();
    return { ok: true };
  } catch (error) {
    console.error('Database error in devAssignBookOwner:', error);
    throw new Error('Failed to link book to user account.', { cause: error });
  }
}

export async function devAddSection(name: string, englishName?: string) {
  try {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false as const, error: 'empty' as const };
    const existing = await db.select().from(librarySections);
    if (existing.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      return { ok: false as const, error: 'duplicate' as const };
    }
    await db.insert(librarySections).values({
      name: trimmed,
      englishName: englishName?.trim() || null,
      sortOrder: existing.length + 1,
    });
    await bumpCatalogVersion();
    return { ok: true as const };
  } catch (error) {
    console.error('Database error in devAddSection:', error);
    throw new Error('Failed to add library section.', { cause: error });
  }
}

export async function devRenameSection(oldName: string, newName: string, englishName?: string) {
  try {
    const trimmed = newName.trim();
    if (!trimmed) return { ok: false as const, error: 'empty' as const };
    const existing = await db.select().from(librarySections);
    if (
      trimmed !== oldName &&
      existing.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      return { ok: false as const, error: 'duplicate' as const };
    }
    const cleanEn = englishName !== undefined ? englishName.trim() || null : undefined;
    await db
      .update(librarySections)
      .set({
        name: trimmed,
        ...(cleanEn !== undefined ? { englishName: cleanEn } : {}),
      })
      .where(eq(librarySections.name, oldName));

    if (trimmed !== oldName) {
      await db.update(books).set({ category: trimmed }).where(eq(books.category, oldName));
    }
    await bumpCatalogVersion();
    return { ok: true as const };
  } catch (error) {
    console.error('Database error in devRenameSection:', error);
    throw new Error('Failed to rename library section.', { cause: error });
  }
}

export async function devDeleteSection(sectionName: string, fallbackSection?: string) {
  try {
    const allSections = await db
      .select()
      .from(librarySections)
      .orderBy(asc(librarySections.sortOrder), asc(librarySections.id));
    const remaining = allSections.filter((s) => s.name !== sectionName);
    const affected = await db.select().from(books).where(eq(books.category, sectionName));
    let reassignedTo: string | null = null;

    if (affected.length > 0) {
      reassignedTo =
        fallbackSection && fallbackSection !== sectionName
          ? fallbackSection
          : (remaining[0]?.name ?? 'عام');
      await db
        .insert(librarySections)
        .values({ name: reassignedTo, sortOrder: 99 })
        .onConflictDoNothing();
      await db.update(books).set({ category: reassignedTo }).where(eq(books.category, sectionName));
    }

    await db.delete(librarySections).where(eq(librarySections.name, sectionName));
    await bumpCatalogVersion();
    return { reassignedTo };
  } catch (error) {
    console.error('Database error in devDeleteSection:', error);
    throw new Error('Failed to delete library section.', { cause: error });
  }
}

export async function devAssignBookSection(bookId: string, sectionName: string): Promise<void> {
  try {
    const trimmed = sectionName.trim();
    if (!trimmed) return;
    await db.insert(librarySections).values({ name: trimmed, sortOrder: 99 }).onConflictDoNothing();
    const [target] = await db.select().from(books).where(eq(books.id, bookId));
    if (!target) return;
    await db
      .update(books)
      .set({
        category: trimmed,
        version: target.version + 1,
        updatedAt: new Date().toISOString().slice(0, 10),
      })
      .where(eq(books.id, bookId));
    await bumpCatalogVersion();
  } catch (error) {
    console.error('Database error in devAssignBookSection:', error);
    throw new Error('Failed to assign book to section.', { cause: error });
  }
}

export async function devGetCodesVault(): Promise<DevCodeEntryDTO[]> {
  try {
    await ensureCatalogSeeded();
    await refreshExpiredRotatingCodes();
    const [premiumBooksRows, themeRows, iconRows, economyConfig] = await Promise.all([
      db.select().from(books).where(eq(books.isPremium, true)),
      db.select().from(premiumThemes),
      db.select().from(premiumIcons),
      getTokenEconomyConfig(),
    ]);

    const entries: DevCodeEntryDTO[] = [];
    for (const b of premiumBooksRows) {
      entries.push({
        targetType: 'book',
        targetId: b.id,
        label: b.title,
        rotatingCode: b.rotatingCode ?? '',
        codeRotatedAt: (b.codeRotatedAt ?? new Date()).toISOString(),
        codeExpiresAt: (b.codeExpiresAt ?? new Date()).toISOString(),
        rotationHours: b.rotationHours,
        priceLabel: b.priceLabel,
        tokenPrice: b.tokenPrice ?? null,
        effectiveTokenPrice: resolveEffectiveBookTokenPrice(b, economyConfig),
      });
    }
    for (const t of themeRows) {
      entries.push({
        targetType: 'theme',
        targetId: t.id,
        label: t.id,
        rotatingCode: t.rotatingCode,
        codeRotatedAt: t.codeRotatedAt.toISOString(),
        codeExpiresAt: t.codeExpiresAt.toISOString(),
        rotationHours: t.rotationHours,
        tokenPrice: t.tokenPrice ?? null,
        effectiveTokenPrice: resolveEffectiveThemeTokenPrice(t, economyConfig),
      });
    }
    for (const ic of iconRows) {
      entries.push({
        targetType: 'icon',
        targetId: ic.id,
        label: getAppIconById(ic.id).name,
        rotatingCode: ic.rotatingCode,
        codeRotatedAt: ic.codeRotatedAt.toISOString(),
        codeExpiresAt: ic.codeExpiresAt.toISOString(),
        rotationHours: ic.rotationHours,
        tokenPrice: ic.tokenPrice ?? null,
        effectiveTokenPrice: resolveEffectiveIconTokenPrice(ic, economyConfig),
      });
    }
    return entries;
  } catch (error) {
    console.error('Database error in devGetCodesVault:', error);
    throw new Error('Failed to load rotating codes vault.', { cause: error });
  }
}

export async function devSetItemTokenPrice(
  targetType: 'book' | 'theme' | 'icon',
  targetId: string,
  tokenPrice: number | null
): Promise<{ ok: boolean; error?: string; tokenPrice: number | null }> {
  try {
    const cleanPrice =
      tokenPrice === null
        ? null
        : Number.isFinite(Number(tokenPrice))
          ? Math.min(1_000_000, Math.max(0, Math.floor(Number(tokenPrice))))
          : null;

    if (targetType === 'book') {
      const [existing] = await db.select({ id: books.id }).from(books).where(eq(books.id, targetId)).limit(1);
      if (!existing) return { ok: false, error: 'Book not found.', tokenPrice: null };
      await db.update(books).set({ tokenPrice: cleanPrice }).where(eq(books.id, targetId));
      await bumpCatalogVersion();
      return { ok: true, tokenPrice: cleanPrice };
    }

    if (targetType === 'icon') {
      const [existingIcon] = await db
        .select({ id: premiumIcons.id })
        .from(premiumIcons)
        .where(eq(premiumIcons.id, targetId))
        .limit(1);
      if (!existingIcon) return { ok: false, error: 'App icon not found.', tokenPrice: null };
      await db
        .update(premiumIcons)
        .set({ tokenPrice: cleanPrice })
        .where(eq(premiumIcons.id, targetId));
      await bumpCatalogVersion();
      return { ok: true, tokenPrice: cleanPrice };
    }

    const [existingTheme] = await db
      .select({ id: premiumThemes.id })
      .from(premiumThemes)
      .where(eq(premiumThemes.id, targetId))
      .limit(1);
    if (!existingTheme) return { ok: false, error: 'Theme not found.', tokenPrice: null };
    await db
      .update(premiumThemes)
      .set({ tokenPrice: cleanPrice })
      .where(eq(premiumThemes.id, targetId));
    await bumpCatalogVersion();
    return { ok: true, tokenPrice: cleanPrice };
  } catch (error) {
    console.error('Database error in devSetItemTokenPrice:', error);
    throw new Error('Failed to update item token price.', { cause: error });
  }
}

export async function devAdjustUserTokens(
  targetUid: string,
  mode: 'add' | 'set',
  amount: number,
  note?: string
): Promise<{ ok: boolean; error?: string; newBalance?: number }> {
  try {
    const [targetUser] = await db
      .select({ uid: users.uid, tokensBalance: users.tokensBalance })
      .from(users)
      .where(eq(users.uid, targetUid))
      .limit(1);
    if (!targetUser) {
      return { ok: false, error: 'User account not found.' };
    }
    const cleanAmount = Math.trunc(Number(amount));
    if (!Number.isFinite(cleanAmount)) {
      return { ok: false, error: 'Invalid token amount.' };
    }
    const cleanNote = (note ?? '').trim();

    const result = await db.transaction(async (tx) => {
      const [freshUser] = await tx
        .select({ tokensBalance: users.tokensBalance })
        .from(users)
        .where(eq(users.uid, targetUid))
        .limit(1);
      const currentBalance = freshUser?.tokensBalance ?? 0;
      const targetBalance =
        mode === 'set'
          ? Math.min(10_000_000, Math.max(0, cleanAmount))
          : Math.min(10_000_000, Math.max(0, currentBalance + cleanAmount));
      const delta = targetBalance - currentBalance;

      await tx
        .update(users)
        .set({ tokensBalance: targetBalance })
        .where(eq(users.uid, targetUid));

      if (delta !== 0) {
        await tx.insert(tokenTransactions).values({
          id: `tok-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userUid: targetUid,
          amount: delta,
          kind: 'developer_adjustment',
          descriptionAr: cleanNote
            ? `تعديل إداري من المطور: ${cleanNote}`
            : delta > 0
              ? 'إضافة عملات ذهبية من المطور'
              : 'خصم عملات ذهبية من المطور',
          descriptionEn: cleanNote
            ? `Developer adjustment: ${cleanNote}`
            : delta > 0
              ? 'Golden Tokens granted by developer'
              : 'Golden Tokens deducted by developer',
          dedupeKey: null,
        });
      }
      return { newBalance: targetBalance, delta };
    });

    if (result.delta > 0) {
      await createUserNotification({
        userUid: targetUid,
        type: 'tokens_earned',
        titleAr: `حصلت على +${result.delta} عملة ذهبية!`,
        titleEn: `You Received +${result.delta} Golden Tokens!`,
        messageAr: cleanNote
          ? `أضاف المطور ${result.delta} عملة ذهبية إلى رصيدك (${cleanNote}).`
          : `أضاف المطور ${result.delta} عملة ذهبية إلى محفظة حسابك.`,
        messageEn: cleanNote
          ? `The developer credited ${result.delta} Golden Tokens to your account (${cleanNote}).`
          : `The developer credited ${result.delta} Golden Tokens to your wallet.`,
        targetView: 'you',
      });
    }

    return { ok: true, newBalance: result.newBalance };
  } catch (error) {
    console.error('Database error in devAdjustUserTokens:', error);
    throw new Error('Failed to adjust user tokens.', { cause: error });
  }
}

export async function devRotateCode(
  targetType: 'book' | 'theme' | 'icon',
  targetId: string,
  customCode?: string,
  rotationHours?: number
): Promise<{ ok: boolean; error?: string; rotatingCode?: string; codeExpiresAt?: string }> {
  try {
    const taken = await getTakenCodesSet(targetId);
    const now = new Date();
    const farFuture = new Date(now.getTime() + SINGLE_USE_GRANT_FAR_FUTURE_MS);

    let nextCode: string;
    if (customCode !== undefined && customCode.trim() !== '') {
      const clean = customCode.replace(/\D/g, '');
      if (clean.length !== 10) {
        return { ok: false, error: 'Code must be exactly 10 digits.' };
      }
      if (taken.has(clean)) {
        return { ok: false, error: 'Code already used by another book, theme, or icon.' };
      }
      nextCode = clean;
    } else {
      nextCode = generateUniqueTenDigitCode(taken);
    }

    if (targetType === 'book') {
      const [existing] = await db.select().from(books).where(eq(books.id, targetId));
      if (!existing) return { ok: false, error: 'Book not found' };
      const hours = Math.max(1, rotationHours ?? existing.rotationHours ?? 24);
      await db
        .update(books)
        .set({
          rotatingCode: nextCode,
          codeRotatedAt: now,
          codeExpiresAt: farFuture,
          rotationHours: hours,
        })
        .where(eq(books.id, targetId));
      await bumpCatalogVersion();
      return { ok: true, rotatingCode: nextCode, codeExpiresAt: farFuture.toISOString() };
    }

    if (targetType === 'icon') {
      const [existingIcon] = await db
        .select()
        .from(premiumIcons)
        .where(eq(premiumIcons.id, targetId));
      if (!existingIcon) return { ok: false, error: 'App icon not found' };
      const hours = Math.max(1, rotationHours ?? existingIcon.rotationHours ?? 24);
      await db
        .update(premiumIcons)
        .set({
          rotatingCode: nextCode,
          codeRotatedAt: now,
          codeExpiresAt: farFuture,
          rotationHours: hours,
        })
        .where(eq(premiumIcons.id, targetId));
      await bumpCatalogVersion();
      return { ok: true, rotatingCode: nextCode, codeExpiresAt: farFuture.toISOString() };
    }

    const [existingTheme] = await db
      .select()
      .from(premiumThemes)
      .where(eq(premiumThemes.id, targetId));
    if (!existingTheme) return { ok: false, error: 'Theme not found' };
    const hours = Math.max(1, rotationHours ?? existingTheme.rotationHours ?? 24);
    await db
      .update(premiumThemes)
      .set({
        rotatingCode: nextCode,
        codeRotatedAt: now,
        codeExpiresAt: farFuture,
        rotationHours: hours,
      })
      .where(eq(premiumThemes.id, targetId));
    await bumpCatalogVersion();
    return { ok: true, rotatingCode: nextCode, codeExpiresAt: farFuture.toISOString() };
  } catch (error) {
    console.error('Database error in devRotateCode:', error);
    throw new Error('Failed to rotate access code.', { cause: error });
  }
}

export async function devRotateAllCodes(): Promise<void> {
  try {
    const now = new Date();
    const farFuture = new Date(now.getTime() + SINGLE_USE_GRANT_FAR_FUTURE_MS);
    const [premiumBooksRows, themeRows, iconRows] = await Promise.all([
      db.select().from(books).where(eq(books.isPremium, true)),
      db.select().from(premiumThemes),
      db.select().from(premiumIcons),
    ]);
    const taken = new Set<string>();

    for (const b of premiumBooksRows) {
      const nextCode = generateUniqueTenDigitCode(taken);
      await db
        .update(books)
        .set({
          rotatingCode: nextCode,
          codeRotatedAt: now,
          codeExpiresAt: farFuture,
        })
        .where(eq(books.id, b.id));
    }

    for (const t of themeRows) {
      const nextCode = generateUniqueTenDigitCode(taken);
      await db
        .update(premiumThemes)
        .set({
          rotatingCode: nextCode,
          codeRotatedAt: now,
          codeExpiresAt: farFuture,
        })
        .where(eq(premiumThemes.id, t.id));
    }

    for (const ic of iconRows) {
      const nextCode = generateUniqueTenDigitCode(taken);
      await db
        .update(premiumIcons)
        .set({
          rotatingCode: nextCode,
          codeRotatedAt: now,
          codeExpiresAt: farFuture,
        })
        .where(eq(premiumIcons.id, ic.id));
    }

    await bumpCatalogVersion();
  } catch (error) {
    console.error('Database error in devRotateAllCodes:', error);
    throw new Error('Failed to rotate all codes.', { cause: error });
  }
}

export async function devListUsersAndPurchases() {
  try {
    const [allUsers, bookPurchases, themePurchases, iconPurchases] = await Promise.all([
      db.select().from(users).orderBy(desc(users.createdAt)),
      db.select().from(userBookPurchases),
      db.select().from(userThemePurchases),
      db.select().from(userIconPurchases),
    ]);
    return allUsers.map((u) => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      isVerified: Boolean(u.isVerified),
      tokensBalance: u.tokensBalance ?? 0,
      createdAt: u.createdAt.toISOString(),
      purchasedBookIds: bookPurchases.filter((p) => p.userUid === u.uid).map((p) => p.bookId),
      purchasedThemeIds: themePurchases.filter((p) => p.userUid === u.uid).map((p) => p.themeId),
      purchasedIconIds: iconPurchases.filter((p) => p.userUid === u.uid).map((p) => p.iconId),
    }));
  } catch (error) {
    console.error('Database error in devListUsersAndPurchases:', error);
    throw new Error('Failed to load user purchases.', { cause: error });
  }
}

export async function devSetUserVerified(
  userUid: string,
  isVerified: boolean
): Promise<{ ok: boolean; error?: string }> {
  try {
    const [existing] = await db.select().from(users).where(eq(users.uid, userUid));
    if (!existing) {
      return { ok: false, error: 'User not found.' };
    }
    const nextVerified = Boolean(isVerified);
    await db
      .update(users)
      .set({ isVerified: nextVerified })
      .where(eq(users.uid, userUid));
    await db
      .update(books)
      .set({ isAuthorVerified: nextVerified })
      .where(eq(books.authorUid, userUid));

    if (Boolean(existing.isVerified) !== nextVerified) {
      await createUserNotification({
        userUid,
        type: 'verified',
        titleAr: nextVerified ? 'تم توثيق حسابك!' : 'تحديث حالة التوثيق',
        titleEn: nextVerified ? 'Account Verified!' : 'Verification Status Updated',
        messageAr: nextVerified
          ? 'مبروك! حصل حسابك على شارة التوثيق الرسمية وتظهر الآن بجانب اسمك وكتبك وتعليقاتك.'
          : 'تمت إزالة شارة التوثيق عن حسابك في الوقت الحالي.',
        messageEn: nextVerified
          ? 'Congratulations! Your account has received the official verified badge across your profile, books, and comments.'
          : 'The verified badge has been removed from your account.',
      });
    }

    await bumpCatalogVersion();
    return { ok: true };
  } catch (error) {
    console.error('Database error in devSetUserVerified:', error);
    throw new Error('Failed to update user verification status.', { cause: error });
  }
}

export async function devGrantPermanentAccessByEmail(
  email: string,
  targetType: 'book' | 'theme' | 'icon',
  targetId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const allUsers = await db.select().from(users);
    const matched = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!matched) {
      return { ok: false, error: 'User with this email has not signed in yet.' };
    }
    if (targetType === 'book') {
      await purchaseBookForUser(matched.uid, targetId, 'developer');
    } else if (targetType === 'icon') {
      await purchaseIconForUser(matched.uid, targetId, 'developer');
    } else {
      await purchaseThemeForUser(matched.uid, targetId, 'developer');
    }
    return { ok: true };
  } catch (error) {
    console.error('Database error in devGrantPermanentAccessByEmail:', error);
    throw new Error('Failed to grant permanent access.', { cause: error });
  }
}

export async function devRevokePermanentAccess(
  userUid: string,
  targetType: 'book' | 'theme' | 'icon',
  targetId: string
): Promise<void> {
  try {
    if (targetType === 'book') {
      await db
        .delete(userBookPurchases)
        .where(
          and(eq(userBookPurchases.userUid, userUid), eq(userBookPurchases.bookId, targetId))
        );
    } else if (targetType === 'icon') {
      await db
        .delete(userIconPurchases)
        .where(
          and(eq(userIconPurchases.userUid, userUid), eq(userIconPurchases.iconId, targetId))
        );
    } else {
      await db
        .delete(userThemePurchases)
        .where(
          and(
            eq(userThemePurchases.userUid, userUid),
            eq(userThemePurchases.themeId, targetId)
          )
        );
    }
  } catch (error) {
    console.error('Database error in devRevokePermanentAccess:', error);
    throw new Error('Failed to revoke permanent access.', { cause: error });
  }
}

async function recalculateBookRating(bookId: string): Promise<number> {
  const rows = await db
    .select({ rating: bookReviews.rating })
    .from(bookReviews)
    .where(and(eq(bookReviews.bookId, bookId), eq(bookReviews.moderationStatus, 'approved')));
  const avg =
    rows.length > 0
      ? Math.min(
          5,
          Math.max(
            0,
            Math.round((rows.reduce((sum, r) => sum + r.rating, 0) / rows.length) * 10) / 10
          )
        )
      : 0;
  await db.update(books).set({ rating: avg }).where(eq(books.id, bookId));
  await bumpCatalogVersion();
  return avg;
}

async function checkAndAwardHighRatingBonus(
  bookId: string,
  averageRating: number
): Promise<void> {
  if (!Number.isFinite(averageRating) || averageRating <= 4) return;
  const [targetBook] = await db
    .select({
      id: books.id,
      title: books.title,
      authorUid: books.authorUid,
      reviewStatus: books.reviewStatus,
    })
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1);

  if (!targetBook || !targetBook.authorUid || targetBook.reviewStatus !== 'approved') return;
  const economy = await getTokenEconomyConfig();
  if (economy.rewardBookRatingAbove4 <= 0) return;

  const res = await creditUserTokens({
    userUid: targetBook.authorUid,
    amount: economy.rewardBookRatingAbove4,
    kind: 'reward_rating_above_4',
    descriptionAr: `مكافأة تجاوز تقييم كتاب «${targetBook.title}» علامة 4.0 ★ (${averageRating}/5)`,
    descriptionEn: `Bonus for "${targetBook.title}" exceeding 4.0 ★ (${averageRating}/5)`,
    targetBookId: targetBook.id,
    dedupeKey: `reward:high_rating_4:${targetBook.id}`,
  });

  if (res.credited) {
    await createUserNotification({
      userUid: targetBook.authorUid,
      type: 'tokens_earned',
      titleAr: `مكافأة التقييم العالي (+${economy.rewardBookRatingAbove4} عملة ذهبية)!`,
      titleEn: `High Rating Bonus (+${economy.rewardBookRatingAbove4} Golden Tokens)!`,
      messageAr: `تجاوز تقييم كتابك «${targetBook.title}» 4.0 نجوم (${averageRating}/5 ★)، وحصلت على ${economy.rewardBookRatingAbove4} عملة ذهبية!`,
      messageEn: `Your book "${targetBook.title}" exceeded 4.0 stars (${averageRating}/5 ★) and earned ${economy.rewardBookRatingAbove4} Golden Tokens!`,
      targetBookId: targetBook.id,
      targetView: 'you',
      dedupeKey: `notif:high_rating_4:${targetBook.id}`,
    });
  }
}

export async function userAddBookReview(
  userUid: string,
  bookId: string,
  rating: number,
  comment: string
): Promise<{
  ok: boolean;
  error?: string;
  averageRating?: number;
  isUpdate?: boolean;
  pendingModeration?: boolean;
}> {
  try {
    const [dbUser] = await db.select().from(users).where(eq(users.uid, userUid)).limit(1);
    if (!dbUser) {
      return { ok: false, error: 'يرجى تسجيل الدخول لإضافة تقييم وتعليق.' };
    }
    const [targetBook] = await db
      .select({
        id: books.id,
        title: books.title,
        authorUid: books.authorUid,
        reviewStatus: books.reviewStatus,
        isComingSoon: books.isComingSoon,
      })
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!targetBook || targetBook.reviewStatus !== 'approved') {
      return { ok: false, error: 'الكتاب غير موجود.' };
    }
    if (targetBook.isComingSoon) {
      return { ok: false, error: 'لا يمكن تقييم الكتب القادمة قبل صدورها.' };
    }
    if (targetBook.authorUid && targetBook.authorUid === userUid) {
      return { ok: false, error: 'لا يمكنك تقييم أو التعليق على كتابك الخاص.' };
    }

    const cleanComment = (comment ?? '').trim();
    const clampedRating = Math.min(5, Math.max(0.5, Math.round(Number(rating) * 10) / 10));
    if (!cleanComment || !Number.isFinite(clampedRating)) {
      return { ok: false, error: 'يرجى اختيار التقييم وكتابة تعليق قبل الإرسال.' };
    }

    const [existingReview] = await db
      .select({ id: bookReviews.id })
      .from(bookReviews)
      .where(and(eq(bookReviews.bookId, bookId), eq(bookReviews.reviewerUid, userUid)))
      .limit(1);

    if (existingReview) {
      await db
        .update(bookReviews)
        .set({
          reviewerName: dbUser.displayName,
          rating: clampedRating,
          comment: cleanComment,
          isVerified: Boolean(dbUser.isVerified),
          moderationStatus: 'pending',
          moderationNote: null,
          createdAt: new Date(),
        })
        .where(eq(bookReviews.id, existingReview.id));

      const averageRating = await recalculateBookRating(bookId);
      return { ok: true, averageRating, isUpdate: true, pendingModeration: true };
    }

    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await db.insert(bookReviews).values({
      id: reviewId,
      bookId,
      reviewerUid: userUid,
      reviewerName: dbUser.displayName,
      rating: clampedRating,
      comment: cleanComment,
      isVerified: Boolean(dbUser.isVerified),
      isOwner: false,
      moderationStatus: 'pending',
      moderationNote: null,
    });

    await bumpCatalogVersion();
    return { ok: true, isUpdate: false, pendingModeration: true };
  } catch (error) {
    console.error('Database error in userAddBookReview:', error);
    throw new Error('Failed to submit book review.', { cause: error });
  }
}

export async function devListPendingBookReviews(): Promise<PendingBookReviewDTO[]> {
  try {
    const [pendingRows, allBooksRows, allUsersRows] = await Promise.all([
      db
        .select()
        .from(bookReviews)
        .where(eq(bookReviews.moderationStatus, 'pending'))
        .orderBy(desc(bookReviews.createdAt)),
      db
        .select({
          id: books.id,
          title: books.title,
          coverUrl: books.coverUrl,
        })
        .from(books),
      db
        .select({
          uid: users.uid,
          displayName: users.displayName,
          isVerified: users.isVerified,
        })
        .from(users),
    ]);

    const booksById = new Map(allBooksRows.map((b) => [b.id, b]));
    const usersByUid = new Map(allUsersRows.map((u) => [u.uid, u]));

    return pendingRows
      .filter((r) => booksById.has(r.bookId))
      .map((r) => {
        const b = booksById.get(r.bookId)!;
        const linkedUser = r.reviewerUid ? usersByUid.get(r.reviewerUid) : undefined;
        return {
          id: r.id,
          bookId: r.bookId,
          bookTitle: b.title,
          bookCoverUrl: b.coverUrl,
          reviewerUid: linkedUser ? linkedUser.uid : r.reviewerUid ?? null,
          reviewerName: linkedUser ? linkedUser.displayName : r.reviewerName,
          rating: r.rating,
          comment: r.comment,
          isVerified: linkedUser ? Boolean(linkedUser.isVerified) : Boolean(r.isVerified),
          createdAt: r.createdAt.toISOString(),
        };
      });
  } catch (error) {
    console.error('Database error in devListPendingBookReviews:', error);
    throw new Error('Failed to load pending reader reviews.', { cause: error });
  }
}

export async function devModerateBookReview(
  reviewId: string,
  decision: 'approve' | 'reject',
  moderationNote?: string
): Promise<{
  ok: boolean;
  error?: string;
  status?: 'approved' | 'rejected';
  averageRating?: number;
}> {
  try {
    const [review] = await db
      .select()
      .from(bookReviews)
      .where(eq(bookReviews.id, reviewId))
      .limit(1);
    if (!review) {
      return { ok: false, error: 'لم يتم العثور على التقييم المطلوب.' };
    }

    const [targetBook] = await db
      .select({
        id: books.id,
        title: books.title,
        authorUid: books.authorUid,
      })
      .from(books)
      .where(eq(books.id, review.bookId))
      .limit(1);

    if (!targetBook) {
      return { ok: false, error: 'الكتاب المرتبط بالتقييم غير موجود.' };
    }

    if (decision === 'reject') {
      const cleanNote = (moderationNote ?? '').trim();
      if (!cleanNote) {
        return { ok: false, error: 'يرجى كتابة سبب الرفض ليظهر لصاحب التقييم.' };
      }

      await db
        .update(bookReviews)
        .set({
          moderationStatus: 'rejected',
          moderationNote: cleanNote,
        })
        .where(eq(bookReviews.id, reviewId));

      const averageRating = await recalculateBookRating(review.bookId);

      if (review.reviewerUid) {
        await createUserNotification({
          userUid: review.reviewerUid,
          type: 'review_rejected',
          titleAr: 'لم تتم الموافقة على تقييمك',
          titleEn: 'Your Review Was Not Approved',
          messageAr: `تم رفض تقييمك لكتاب «${targetBook.title}». سبب المطور: ${cleanNote}. يمكنك تعديل تقييمك وإعادة إرساله من صفحة الكتاب.`,
          messageEn: `Your review for "${targetBook.title}" was declined. Reason: ${cleanNote}. You can edit and resubmit it on the book page.`,
          targetBookId: targetBook.id,
          dedupeKey: `review_rejected:${review.id}:${Date.now()}`,
        });
      }

      return { ok: true, status: 'rejected', averageRating };
    }

    // decision === 'approve'
    await db
      .update(bookReviews)
      .set({
        moderationStatus: 'approved',
        moderationNote: null,
      })
      .where(eq(bookReviews.id, reviewId));

    const averageRating = await recalculateBookRating(review.bookId);
    const linkedReviewer = review.reviewerUid
      ? (
          await db
            .select({ uid: users.uid, displayName: users.displayName })
            .from(users)
            .where(eq(users.uid, review.reviewerUid))
            .limit(1)
        )[0]
      : undefined;
    const reviewerDisplayName = linkedReviewer?.displayName || review.reviewerName;

    if (review.reviewerUid) {
      await createUserNotification({
        userUid: review.reviewerUid,
        type: 'review_approved',
        titleAr: 'تم نشر تقييمك للكتاب!',
        titleEn: 'Your Book Review Is Now Live!',
        messageAr: `وافق المطور على تقييمك (${review.rating}/5 ★) وتعليقك لكتاب «${targetBook.title}» وأصبح ظاهراً للجميع.`,
        messageEn: `Your review (${review.rating}/5 ★) for "${targetBook.title}" has been approved and is now published!`,
        targetBookId: targetBook.id,
        dedupeKey: `review_approved:${review.id}:${Date.now()}`,
      });
    }

    if (targetBook.authorUid) {
      const economy = await getTokenEconomyConfig();
      const commentBonus = economy.rewardCommentOnBook;
      let earnedTextAr = '';
      let earnedTextEn = '';
      if (commentBonus > 0 && review.reviewerUid !== targetBook.authorUid) {
        const creditRes = await creditUserTokens({
          userUid: targetBook.authorUid,
          amount: commentBonus,
          kind: 'reward_comment',
          descriptionAr: `مكافأة تعليق ${reviewerDisplayName} على كتاب «${targetBook.title}»`,
          descriptionEn: `Reward for ${reviewerDisplayName}'s comment on "${targetBook.title}"`,
          targetBookId: targetBook.id,
          dedupeKey: `reward:comment:${review.id}`,
        });
        if (creditRes.credited) {
          earnedTextAr = ` وحصلت على +${commentBonus} عملة ذهبية!`;
          earnedTextEn = ` and you earned +${commentBonus} Golden Tokens!`;
        }
      }

      await createUserNotification({
        userUid: targetBook.authorUid,
        type: 'book_review',
        titleAr: 'تعليق وتقييم جديد على كتابك',
        titleEn: 'New Review on Your Book',
        messageAr: `أضاف ${reviewerDisplayName} تقييماً (${review.rating}/5 ★) وتعليقاً على كتابك «${targetBook.title}»${earnedTextAr}`,
        messageEn: `${reviewerDisplayName} rated "${targetBook.title}" (${review.rating}/5 ★) and left a comment${earnedTextEn}`,
        targetBookId: targetBook.id,
        targetUserUid: review.reviewerUid ?? null,
        dedupeKey: `notif:approved_review:${review.id}`,
      });

      await checkAndAwardHighRatingBonus(targetBook.id, averageRating);
    }

    return { ok: true, status: 'approved', averageRating };
  } catch (error) {
    console.error('Database error in devModerateBookReview:', error);
    throw new Error('Failed to moderate book review.', { cause: error });
  }
}

export async function devAddBookReview(
  bookId: string,
  reviewerName: string,
  rating: number,
  comment: string,
  isOwner = false,
  isVerified = false,
  reviewerUid?: string | null
): Promise<{ ok: boolean; error?: string; averageRating?: number }> {
  try {
    const cleanUid = typeof reviewerUid === 'string' && reviewerUid.trim() ? reviewerUid.trim() : null;
    let resolvedUid: string | null = null;
    let resolvedName = reviewerName.trim();
    const ownerFlag = Boolean(isOwner);
    let verifiedFlag = Boolean(isVerified || ownerFlag);

    if (cleanUid) {
      const [linkedUser] = await db.select().from(users).where(eq(users.uid, cleanUid)).limit(1);
      if (!linkedUser) {
        return { ok: false, error: 'Linked account not found.' };
      }
      resolvedUid = linkedUser.uid;
      resolvedName = linkedUser.displayName;
      verifiedFlag = Boolean(linkedUser.isVerified);
    }

    const cleanComment = comment.trim();
    const clampedRating = Math.min(5, Math.max(0.5, Math.round(Number(rating) * 10) / 10));
    if (!resolvedName || !cleanComment || !Number.isFinite(clampedRating)) {
      return { ok: false, error: 'Reviewer name, rating, and comment are required.' };
    }
    const [targetBook] = await db
      .select({ id: books.id, title: books.title, authorUid: books.authorUid })
      .from(books)
      .where(eq(books.id, bookId));
    if (!targetBook) {
      return { ok: false, error: 'Book not found.' };
    }
    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await db.insert(bookReviews).values({
      id: reviewId,
      bookId,
      reviewerUid: resolvedUid,
      reviewerName: resolvedName,
      rating: clampedRating,
      comment: cleanComment,
      isVerified: verifiedFlag,
      isOwner: ownerFlag,
      moderationStatus: 'approved',
      moderationNote: null,
    });
    const averageRating = await recalculateBookRating(bookId);

    if (targetBook.authorUid) {
      let earnedTextAr = '';
      let earnedTextEn = '';
      if (!resolvedUid || resolvedUid !== targetBook.authorUid) {
        const economy = await getTokenEconomyConfig();
        if (economy.rewardCommentOnBook > 0) {
          const creditRes = await creditUserTokens({
            userUid: targetBook.authorUid,
            amount: economy.rewardCommentOnBook,
            kind: 'reward_comment',
            descriptionAr: `مكافأة تعليق ${resolvedName} على كتاب «${targetBook.title}»`,
            descriptionEn: `Reward for ${resolvedName}'s comment on "${targetBook.title}"`,
            targetBookId: bookId,
            dedupeKey: `reward:comment:${reviewId}`,
          });
          if (creditRes.credited) {
            earnedTextAr = ` وحصلت على +${economy.rewardCommentOnBook} عملة ذهبية!`;
            earnedTextEn = ` and you earned +${economy.rewardCommentOnBook} Golden Tokens!`;
          }
        }
      }

      await createUserNotification({
        userUid: targetBook.authorUid,
        type: 'book_review',
        titleAr: 'تعليق وتقييم جديد على كتابك',
        titleEn: 'New Review on Your Book',
        messageAr: `أضاف ${resolvedName} تقييماً (${clampedRating}/5 ★) وتعليقاً على كتابك «${targetBook.title}»${earnedTextAr}`,
        messageEn: `${resolvedName} rated "${targetBook.title}" (${clampedRating}/5 ★) and left a comment${earnedTextEn}`,
        targetBookId: bookId,
        targetUserUid: resolvedUid,
      });

      await checkAndAwardHighRatingBonus(bookId, averageRating);
    }

    return { ok: true, averageRating };
  } catch (error) {
    console.error('Database error in devAddBookReview:', error);
    throw new Error('Failed to add book review.', { cause: error });
  }
}

export async function devUpdateBookReview(
  reviewId: string,
  reviewerName: string,
  rating: number,
  comment: string,
  isOwner = false,
  isVerified = false,
  reviewerUid?: string | null
): Promise<{ ok: boolean; error?: string; averageRating?: number }> {
  try {
    const cleanUid = typeof reviewerUid === 'string' && reviewerUid.trim() ? reviewerUid.trim() : null;
    let resolvedUid: string | null = null;
    let resolvedName = reviewerName.trim();
    const ownerFlag = Boolean(isOwner);
    let verifiedFlag = Boolean(isVerified || ownerFlag);

    if (cleanUid) {
      const [linkedUser] = await db.select().from(users).where(eq(users.uid, cleanUid)).limit(1);
      if (!linkedUser) {
        return { ok: false, error: 'Linked account not found.' };
      }
      resolvedUid = linkedUser.uid;
      resolvedName = linkedUser.displayName;
      verifiedFlag = Boolean(linkedUser.isVerified);
    }

    const cleanComment = comment.trim();
    const clampedRating = Math.min(5, Math.max(0.5, Math.round(Number(rating) * 10) / 10));
    if (!resolvedName || !cleanComment || !Number.isFinite(clampedRating)) {
      return { ok: false, error: 'Reviewer name, rating, and comment are required.' };
    }
    const [existing] = await db
      .select()
      .from(bookReviews)
      .where(eq(bookReviews.id, reviewId));
    if (!existing) {
      return { ok: false, error: 'Review not found.' };
    }
    await db
      .update(bookReviews)
      .set({
        reviewerUid: resolvedUid,
        reviewerName: resolvedName,
        rating: clampedRating,
        comment: cleanComment,
        isVerified: verifiedFlag,
        isOwner: ownerFlag,
      })
      .where(eq(bookReviews.id, reviewId));
    const averageRating = await recalculateBookRating(existing.bookId);
    await checkAndAwardHighRatingBonus(existing.bookId, averageRating);
    return { ok: true, averageRating };
  } catch (error) {
    console.error('Database error in devUpdateBookReview:', error);
    throw new Error('Failed to update book review.', { cause: error });
  }
}

export async function devDeleteBookReview(
  reviewId: string
): Promise<{ ok: boolean; error?: string; averageRating?: number }> {
  try {
    const [existing] = await db
      .select()
      .from(bookReviews)
      .where(eq(bookReviews.id, reviewId));
    if (!existing) {
      return { ok: false, error: 'Review not found.' };
    }
    await db.delete(bookReviews).where(eq(bookReviews.id, reviewId));
    const averageRating = await recalculateBookRating(existing.bookId);
    return { ok: true, averageRating };
  } catch (error) {
    console.error('Database error in devDeleteBookReview:', error);
    throw new Error('Failed to delete book review.', { cause: error });
  }
}

export async function toggleFollowUser(
  followerUid: string,
  targetUid: string,
  shouldFollow: boolean
): Promise<{ ok: boolean; isFollowing: boolean; followersCount: number; error?: string }> {
  try {
    if (followerUid === targetUid) {
      return {
        ok: false,
        isFollowing: false,
        followersCount: 0,
        error: 'Cannot follow your own account.',
      };
    }
    const [targetUser] = await db.select().from(users).where(eq(users.uid, targetUid)).limit(1);
    if (!targetUser) {
      return {
        ok: false,
        isFollowing: false,
        followersCount: 0,
        error: 'Target account not found.',
      };
    }

    let wasAlreadyFollowing = false;
    if (shouldFollow) {
      const [existingFollow] = await db
        .select({ id: userFollows.id })
        .from(userFollows)
        .where(
          and(eq(userFollows.followerUid, followerUid), eq(userFollows.targetUid, targetUid))
        )
        .limit(1);
      wasAlreadyFollowing = Boolean(existingFollow);

      await db
        .insert(userFollows)
        .values({ followerUid, targetUid })
        .onConflictDoNothing();
    } else {
      await db
        .delete(userFollows)
        .where(
          and(eq(userFollows.followerUid, followerUid), eq(userFollows.targetUid, targetUid))
        );
    }

    const followers = await db
      .select({ id: userFollows.id })
      .from(userFollows)
      .where(eq(userFollows.targetUid, targetUid));

    const newFollowersCount = followers.length;
    if (shouldFollow && !wasAlreadyFollowing) {
      const [followerUser] = await db
        .select({ displayName: users.displayName })
        .from(users)
        .where(eq(users.uid, followerUid))
        .limit(1);
      const followerName = followerUser?.displayName || 'قارئ';

      await createUserNotification({
        userUid: targetUid,
        type: 'new_follower',
        titleAr: 'متابع جديد لحسابك',
        titleEn: 'New Follower',
        messageAr: `بدأ ${followerName} بمتابعة حسابك وكتبك.`,
        messageEn: `${followerName} started following your account.`,
        targetUserUid: followerUid,
        dedupeKey: `new_follower:${followerUid}`,
      });

      const economy = await getTokenEconomyConfig();
      if (economy.rewardNewFollower > 0) {
        await creditUserTokens({
          userUid: targetUid,
          amount: economy.rewardNewFollower,
          kind: 'reward_new_follower',
          descriptionAr: `مكافأة متابع جديد: ${followerName}`,
          descriptionEn: `Reward for new follower: ${followerName}`,
          dedupeKey: `reward:follower:${followerUid}`,
        });
      }

      if (newFollowersCount > 0 && newFollowersCount % 5 === 0) {
        await createUserNotification({
          userUid: targetUid,
          type: 'followers_milestone',
          titleAr: `إنجاز جديد: ${newFollowersCount} متابعاً!`,
          titleEn: `Milestone: ${newFollowersCount} Followers!`,
          messageAr: `تهانينا! وصل عدد متابعي حسابك الآن إلى ${newFollowersCount} متابعاً.`,
          messageEn: `Congratulations! Your account has now reached ${newFollowersCount} followers.`,
          targetUserUid: targetUid,
          dedupeKey: `followers_milestone:${newFollowersCount}`,
        });
      }
    }

    return {
      ok: true,
      isFollowing: shouldFollow,
      followersCount: newFollowersCount,
    };
  } catch (error) {
    console.error('Database error in toggleFollowUser:', error);
    throw new Error('Failed to update follow status.', { cause: error });
  }
}

export async function getPublicUserProfile(
  targetUid: string,
  viewerUid: string | null
): Promise<PublicUserProfileDTO | null> {
  try {
    const [targetUser] = await db.select().from(users).where(eq(users.uid, targetUid)).limit(1);
    if (!targetUser) return null;

    const now = new Date();
    const [
      allBooks,
      themeRows,
      bookPurchases,
      themePurchases,
      codeGrants,
      progressRows,
      followersRows,
      followingRows,
    ] = await Promise.all([
      db.select().from(books),
      db.select().from(premiumThemes),
      db.select().from(userBookPurchases).where(eq(userBookPurchases.userUid, targetUid)),
      db.select().from(userThemePurchases).where(eq(userThemePurchases.userUid, targetUid)),
      db.select().from(userCodeGrants).where(eq(userCodeGrants.userUid, targetUid)),
      db.select().from(readingProgress).where(eq(readingProgress.userUid, targetUid)),
      db.select().from(userFollows).where(eq(userFollows.targetUid, targetUid)),
      db.select().from(userFollows).where(eq(userFollows.followerUid, targetUid)),
    ]);

    const approvedBooks = allBooks.filter((b) => b.reviewStatus === 'approved');
    const publishedBookIds = approvedBooks
      .filter((b) => b.authorUid === targetUid)
      .map((b) => b.id);

    const bookPurchaseMap = new Map(bookPurchases.map((p) => [p.bookId, p]));
    const themePurchaseMap = new Map(themePurchases.map((p) => [p.themeId, p]));
    const grantMap = new Map(codeGrants.map((g) => [`${g.targetType}:${g.targetId}`, g]));

    const unlockedPremiumBookIds: string[] = [];
    const unlockedPremiumThemeIds: string[] = [];
    const purchasedIds: string[] = [];
    const premiumAccessMeta: Record<string, { accessType: 'purchased' | 'code'; expiresAt?: string }> = {};

    for (const b of allBooks) {
      if (!b.isPremium) continue;
      const purchase = bookPurchaseMap.get(b.id);
      const grant = grantMap.get(`book:${b.id}`);
      const hasValidGrant = Boolean(grant);

      if (purchase) {
        unlockedPremiumBookIds.push(b.id);
        purchasedIds.push(b.id);
        premiumAccessMeta[b.id] = { accessType: 'purchased' };
      } else if (hasValidGrant) {
        unlockedPremiumBookIds.push(b.id);
        premiumAccessMeta[b.id] = {
          accessType: 'code',
        };
      }
    }

    for (const t of themeRows) {
      const purchase = themePurchaseMap.get(t.id);
      const grant = grantMap.get(`theme:${t.id}`);
      const hasValidGrant = Boolean(grant);

      if (purchase) {
        unlockedPremiumThemeIds.push(t.id);
        purchasedIds.push(t.id);
        premiumAccessMeta[t.id] = { accessType: 'purchased' };
      } else if (hasValidGrant) {
        unlockedPremiumThemeIds.push(t.id);
        premiumAccessMeta[t.id] = {
          accessType: 'code',
        };
      }
    }

    const booksById = new Map(approvedBooks.map((b) => [b.id, b]));
    const unlockedBookSet = new Set(unlockedPremiumBookIds);
    const completedBookIds: string[] = [];
    let inProgressCount = 0;
    let totalBookmarks = 0;

    for (const p of progressRows) {
      const book = booksById.get(p.bookId);
      if (!book) continue;
      if (book.isPremium && !unlockedBookSet.has(book.id)) continue;
      totalBookmarks += p.bookmarksJson?.length ?? 0;

      const isFlip = book.bookType === 'pdf' || book.bookType === 'word';
      const totalUnits = isFlip
        ? Math.max(1, book.pdfPageCount ?? book.pages ?? 1)
        : Math.max(1, book.chaptersJson?.length ?? 0);
      const completed =
        totalUnits <= 1
          ? p.scrollRatio >= 0.8 || p.chapterIndex >= 1
          : p.chapterIndex >= totalUnits - 1;

      if (completed) {
        completedBookIds.push(book.id);
      } else {
        inProgressCount++;
      }
    }

    return {
      uid: targetUser.uid,
      displayName: targetUser.displayName,
      isVerified: Boolean(targetUser.isVerified),
      tokensBalance: Number(targetUser.tokensBalance ?? 0),
      createdAt: targetUser.createdAt.toISOString(),
      followersCount: followersRows.length,
      followingCount: followingRows.length,
      isFollowing: Boolean(viewerUid && followersRows.some((f) => f.followerUid === viewerUid)),
      publishedBookIds,
      completedBookIds,
      inProgressCount,
      totalBookmarks,
      unlockedPremiumBookIds,
      unlockedPremiumThemeIds,
      purchasedIds,
      premiumAccessMeta,
    };
  } catch (error) {
    console.error('Database error in getPublicUserProfile:', error);
    throw new Error('Failed to load user profile.', { cause: error });
  }
}

export async function toggleReviewLike(
  userUid: string,
  reviewId: string
): Promise<{ ok: boolean; reviewId: string; likesCount: number; likedByMe: boolean; error?: string }> {
  try {
    const [review] = await db
      .select()
      .from(bookReviews)
      .where(eq(bookReviews.id, reviewId))
      .limit(1);
    if (!review) {
      return { ok: false, reviewId, likesCount: 0, likedByMe: false, error: 'Review not found.' };
    }

    const [existingLike] = await db
      .select({ id: bookReviewLikes.id })
      .from(bookReviewLikes)
      .where(and(eq(bookReviewLikes.reviewId, reviewId), eq(bookReviewLikes.userUid, userUid)))
      .limit(1);

    let likedByMe = false;
    if (existingLike) {
      await db
        .delete(bookReviewLikes)
        .where(and(eq(bookReviewLikes.reviewId, reviewId), eq(bookReviewLikes.userUid, userUid)));
      likedByMe = false;
    } else {
      await db
        .insert(bookReviewLikes)
        .values({ reviewId, userUid })
        .onConflictDoNothing();
      likedByMe = true;

      const [book] = await db
        .select({ id: books.id, title: books.title, authorUid: books.authorUid })
        .from(books)
        .where(eq(books.id, review.bookId))
        .limit(1);

      if (book?.authorUid && book.authorUid !== userUid) {
        const [liker] = await db
          .select({ displayName: users.displayName })
          .from(users)
          .where(eq(users.uid, userUid))
          .limit(1);
        const likerName = liker?.displayName || 'قارئ';
        await createUserNotification({
          userUid: book.authorUid,
          type: 'review_like',
          titleAr: 'إعجاب جديد على تعليق في كتابك',
          titleEn: 'New Like on Your Book Comment',
          messageAr: `أُعجب ${likerName} بتعليق ${review.reviewerName} على كتابك «${book.title}».`,
          messageEn: `${likerName} liked ${review.reviewerName}'s comment on your book "${book.title}".`,
          targetBookId: book.id,
          targetUserUid: userUid,
          dedupeKey: `review_like:${reviewId}:${userUid}`,
        });
      }

      if (review.reviewerUid && review.reviewerUid !== userUid) {
        const economy = await getTokenEconomyConfig();
        if (economy.rewardReviewLike > 0) {
          await creditUserTokens({
            userUid: review.reviewerUid,
            amount: economy.rewardReviewLike,
            kind: 'reward_review_like',
            descriptionAr: `مكافأة إعجاب قارئ بتعليقك على «${book?.title ?? ''}»`,
            descriptionEn: `Reward for a reader liking your comment on "${book?.title ?? ''}"`,
            targetBookId: review.bookId,
            dedupeKey: `reward:review_like:${reviewId}:${userUid}`,
          });
        }
      }
    }

    const allLikes = await db
      .select({ id: bookReviewLikes.id })
      .from(bookReviewLikes)
      .where(eq(bookReviewLikes.reviewId, reviewId));

    return {
      ok: true,
      reviewId,
      likesCount: allLikes.length,
      likedByMe,
    };
  } catch (error) {
    console.error('Database error in toggleReviewLike:', error);
    throw new Error('Failed to update review like.', { cause: error });
  }
}

export async function getUserDirectoryForGifting(viewerUid: string): Promise<DirectoryAccountDTO[]> {
  try {
    const [allUsers, allFollows, allBooks, allBookPurchases, allThemePurchases, allGrants] =
      await Promise.all([
        db
          .select({
            uid: users.uid,
            displayName: users.displayName,
            isVerified: users.isVerified,
          })
          .from(users),
        db.select().from(userFollows),
        db
          .select({
            id: books.id,
            authorUid: books.authorUid,
            reviewStatus: books.reviewStatus,
            isPremium: books.isPremium,
            isComingSoon: books.isComingSoon,
          })
          .from(books),
        db
          .select({ userUid: userBookPurchases.userUid, bookId: userBookPurchases.bookId })
          .from(userBookPurchases),
        db
          .select({ userUid: userThemePurchases.userUid, themeId: userThemePurchases.themeId })
          .from(userThemePurchases),
        db
          .select({
            userUid: userCodeGrants.userUid,
            targetType: userCodeGrants.targetType,
            targetId: userCodeGrants.targetId,
          })
          .from(userCodeGrants),
      ]);

    const followersCountMap = new Map<string, number>();
    const followingSet = new Set<string>();
    const publishedCountMap = new Map<string, number>();
    const tradableBookIds = new Set<string>();
    const validThemeIds = new Set<string>(THEME_CATALOG.map((t) => t.id));

    for (const f of allFollows) {
      followersCountMap.set(f.targetUid, (followersCountMap.get(f.targetUid) ?? 0) + 1);
      if (f.followerUid === viewerUid) {
        followingSet.add(f.targetUid);
      }
    }
    for (const b of allBooks) {
      if (b.authorUid && b.reviewStatus === 'approved') {
        publishedCountMap.set(b.authorUid, (publishedCountMap.get(b.authorUid) ?? 0) + 1);
      }
      if (b.reviewStatus === 'approved' && b.isPremium && !b.isComingSoon) {
        tradableBookIds.add(b.id);
      }
    }

    const ownedBooksMap = new Map<string, Set<string>>();
    const ownedThemesMap = new Map<string, Set<string>>();
    const ensureSet = (map: Map<string, Set<string>>, uid: string) => {
      let set = map.get(uid);
      if (!set) {
        set = new Set<string>();
        map.set(uid, set);
      }
      return set;
    };

    for (const bp of allBookPurchases) {
      if (tradableBookIds.has(bp.bookId)) {
        ensureSet(ownedBooksMap, bp.userUid).add(bp.bookId);
      }
    }
    for (const tp of allThemePurchases) {
      if (validThemeIds.has(tp.themeId)) {
        ensureSet(ownedThemesMap, tp.userUid).add(tp.themeId);
      }
    }
    for (const g of allGrants) {
      if (g.targetType === 'book' && tradableBookIds.has(g.targetId)) {
        ensureSet(ownedBooksMap, g.userUid).add(g.targetId);
      } else if (g.targetType === 'theme' && validThemeIds.has(g.targetId)) {
        ensureSet(ownedThemesMap, g.userUid).add(g.targetId);
      }
    }

    const sanitizeReaderName = (raw: string): string => {
      const trimmed = (raw || '').trim();
      if (!trimmed) return 'Reader';
      const atIdx = trimmed.indexOf('@');
      return atIdx > 0 ? trimmed.slice(0, atIdx) : trimmed;
    };

    const list: DirectoryAccountDTO[] = allUsers
      .filter((u) => u.uid !== viewerUid)
      .map((u) => ({
        uid: u.uid,
        displayName: sanitizeReaderName(u.displayName),
        isVerified: Boolean(u.isVerified),
        followersCount: followersCountMap.get(u.uid) ?? 0,
        publishedBooksCount: publishedCountMap.get(u.uid) ?? 0,
        isFollowing: followingSet.has(u.uid),
        ownedBookIds: Array.from(ownedBooksMap.get(u.uid) ?? []),
        ownedThemeIds: Array.from(ownedThemesMap.get(u.uid) ?? []),
      }));

    list.sort((a, b) => {
      if (a.isFollowing !== b.isFollowing) return a.isFollowing ? -1 : 1;
      if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
      return a.displayName.localeCompare(b.displayName);
    });

    return list;
  } catch (error) {
    console.error('Database error in getUserDirectoryForGifting:', error);
    throw new Error('Failed to load user directory.', { cause: error });
  }
}

export async function transferPremiumGift(
  senderUid: string,
  recipientUid: string,
  targetType: 'book' | 'theme',
  targetId: string
): Promise<{ ok: boolean; error?: string; itemLabel?: string }> {
  try {
    const cleanRecipientUid = recipientUid.trim();
    if (!cleanRecipientUid || cleanRecipientUid === senderUid) {
      return { ok: false, error: 'Choose another friend account to send the gift to.' };
    }

    const [[senderUser], [recipientUser]] = await Promise.all([
      db.select({ uid: users.uid, displayName: users.displayName }).from(users).where(eq(users.uid, senderUid)).limit(1),
      db.select({ uid: users.uid, displayName: users.displayName }).from(users).where(eq(users.uid, cleanRecipientUid)).limit(1),
    ]);

    if (!senderUser || !recipientUser) {
      return { ok: false, error: 'Recipient account was not found.' };
    }

    const now = new Date();
    let itemTitleAr = targetId;
    let itemTitleEn = targetId;
    let activeRotatingCode: string | null = null;

    if (targetType === 'book') {
      const [book] = await db.select().from(books).where(eq(books.id, targetId)).limit(1);
      if (!book || !book.isPremium || book.reviewStatus !== 'approved') {
        return { ok: false, error: 'Premium book not found.' };
      }
      if (book.isComingSoon) {
        return { ok: false, error: 'This book has not launched yet.' };
      }
      itemTitleAr = book.title;
      itemTitleEn = book.title;
      activeRotatingCode = book.rotatingCode ?? null;

      const [[senderPerm], [recipientPerm], [senderGrant], [recipientGrant]] = await Promise.all([
        db
          .select()
          .from(userBookPurchases)
          .where(and(eq(userBookPurchases.userUid, senderUid), eq(userBookPurchases.bookId, targetId)))
          .limit(1),
        db
          .select()
          .from(userBookPurchases)
          .where(
            and(eq(userBookPurchases.userUid, cleanRecipientUid), eq(userBookPurchases.bookId, targetId))
          )
          .limit(1),
        db
          .select()
          .from(userCodeGrants)
          .where(
            and(
              eq(userCodeGrants.userUid, senderUid),
              eq(userCodeGrants.targetType, 'book'),
              eq(userCodeGrants.targetId, targetId)
            )
          )
          .limit(1),
        db
          .select()
          .from(userCodeGrants)
          .where(
            and(
              eq(userCodeGrants.userUid, cleanRecipientUid),
              eq(userCodeGrants.targetType, 'book'),
              eq(userCodeGrants.targetId, targetId)
            )
          )
          .limit(1),
      ]);

      const senderHasValidGrant = Boolean(senderGrant);

      if (!senderPerm && !senderHasValidGrant) {
        return { ok: false, error: 'You do not currently have this premium book unlocked.' };
      }

      if (recipientPerm) {
        return {
          ok: false,
          error: 'This account already owns this premium book permanently.',
        };
      }

      if (senderPerm) {
        await db.transaction(async (tx) => {
          await tx
            .delete(userBookPurchases)
            .where(and(eq(userBookPurchases.userUid, senderUid), eq(userBookPurchases.bookId, targetId)));
          await tx
            .delete(userCodeGrants)
            .where(
              and(
                eq(userCodeGrants.userUid, senderUid),
                eq(userCodeGrants.targetType, 'book'),
                eq(userCodeGrants.targetId, targetId)
              )
            );
          await tx
            .delete(userCodeGrants)
            .where(
              and(
                eq(userCodeGrants.userUid, cleanRecipientUid),
                eq(userCodeGrants.targetType, 'book'),
                eq(userCodeGrants.targetId, targetId)
              )
            );
          await tx
            .insert(userBookPurchases)
            .values({
              userUid: cleanRecipientUid,
              bookId: targetId,
              grantedBy: `gift:${senderUid}`,
            })
            .onConflictDoNothing();
        });
      } else {
        const recipientHasValidGrant = Boolean(recipientGrant);
        if (recipientHasValidGrant) {
          return {
            ok: false,
            error: 'This account already has this premium book unlocked.',
          };
        }
        await db.transaction(async (tx) => {
          await tx
            .delete(userCodeGrants)
            .where(
              and(
                eq(userCodeGrants.userUid, senderUid),
                eq(userCodeGrants.targetType, 'book'),
                eq(userCodeGrants.targetId, targetId)
              )
            );
          await tx
            .insert(userCodeGrants)
            .values({
              userUid: cleanRecipientUid,
              targetType: 'book',
              targetId,
              codeSnapshot: senderGrant!.codeSnapshot,
              grantedAt: now,
              expiresAt: senderGrant!.expiresAt,
            })
            .onConflictDoUpdate({
              target: [userCodeGrants.userUid, userCodeGrants.targetType, userCodeGrants.targetId],
              set: {
                codeSnapshot: senderGrant!.codeSnapshot,
                grantedAt: now,
                expiresAt: senderGrant!.expiresAt,
              },
            });
        });
      }
    } else {
      const [themeRow] = await db
        .select()
        .from(premiumThemes)
        .where(eq(premiumThemes.id, targetId))
        .limit(1);
      if (!themeRow) {
        return { ok: false, error: 'Premium theme not found.' };
      }
      const themeDef = THEME_CATALOG.find((t) => t.id === targetId);
      itemTitleAr = themeDef?.name ?? targetId;
      itemTitleEn = themeDef?.nameEn ?? targetId;
      activeRotatingCode = themeRow.rotatingCode;

      const [[senderPerm], [recipientPerm], [senderGrant], [recipientGrant]] = await Promise.all([
        db
          .select()
          .from(userThemePurchases)
          .where(
            and(eq(userThemePurchases.userUid, senderUid), eq(userThemePurchases.themeId, targetId))
          )
          .limit(1),
        db
          .select()
          .from(userThemePurchases)
          .where(
            and(
              eq(userThemePurchases.userUid, cleanRecipientUid),
              eq(userThemePurchases.themeId, targetId)
            )
          )
          .limit(1),
        db
          .select()
          .from(userCodeGrants)
          .where(
            and(
              eq(userCodeGrants.userUid, senderUid),
              eq(userCodeGrants.targetType, 'theme'),
              eq(userCodeGrants.targetId, targetId)
            )
          )
          .limit(1),
        db
          .select()
          .from(userCodeGrants)
          .where(
            and(
              eq(userCodeGrants.userUid, cleanRecipientUid),
              eq(userCodeGrants.targetType, 'theme'),
              eq(userCodeGrants.targetId, targetId)
            )
          )
          .limit(1),
      ]);

      const senderHasValidGrant = Boolean(senderGrant);

      if (!senderPerm && !senderHasValidGrant) {
        return { ok: false, error: 'You do not currently have this premium theme unlocked.' };
      }

      if (recipientPerm) {
        return {
          ok: false,
          error: 'This account already owns this premium theme permanently.',
        };
      }

      if (senderPerm) {
        await db.transaction(async (tx) => {
          await tx
            .delete(userThemePurchases)
            .where(
              and(eq(userThemePurchases.userUid, senderUid), eq(userThemePurchases.themeId, targetId))
            );
          await tx
            .delete(userCodeGrants)
            .where(
              and(
                eq(userCodeGrants.userUid, senderUid),
                eq(userCodeGrants.targetType, 'theme'),
                eq(userCodeGrants.targetId, targetId)
              )
            );
          await tx
            .delete(userCodeGrants)
            .where(
              and(
                eq(userCodeGrants.userUid, cleanRecipientUid),
                eq(userCodeGrants.targetType, 'theme'),
                eq(userCodeGrants.targetId, targetId)
              )
            );
          await tx
            .insert(userThemePurchases)
            .values({
              userUid: cleanRecipientUid,
              themeId: targetId,
              grantedBy: `gift:${senderUid}`,
            })
            .onConflictDoNothing();
        });
      } else {
        const recipientHasValidGrant = Boolean(recipientGrant);
        if (recipientHasValidGrant) {
          return {
            ok: false,
            error: 'This account already has this premium theme unlocked.',
          };
        }
        await db.transaction(async (tx) => {
          await tx
            .delete(userCodeGrants)
            .where(
              and(
                eq(userCodeGrants.userUid, senderUid),
                eq(userCodeGrants.targetType, 'theme'),
                eq(userCodeGrants.targetId, targetId)
              )
            );
          await tx
            .insert(userCodeGrants)
            .values({
              userUid: cleanRecipientUid,
              targetType: 'theme',
              targetId,
              codeSnapshot: senderGrant!.codeSnapshot,
              grantedAt: now,
              expiresAt: senderGrant!.expiresAt,
            })
            .onConflictDoUpdate({
              target: [userCodeGrants.userUid, userCodeGrants.targetType, userCodeGrants.targetId],
              set: {
                codeSnapshot: senderGrant!.codeSnapshot,
                grantedAt: now,
                expiresAt: senderGrant!.expiresAt,
              },
            });
        });
      }
    }

    // Cancel any stale pending trades where sender offered this gifted item
    await db
      .update(premiumTradeRequests)
      .set({ status: 'cancelled', respondedAt: now })
      .where(
        and(
          eq(premiumTradeRequests.status, 'pending'),
          eq(premiumTradeRequests.senderUid, senderUid),
          eq(premiumTradeRequests.offeredType, targetType),
          eq(premiumTradeRequests.offeredId, targetId)
        )
      );

    await createUserNotification({
      userUid: cleanRecipientUid,
      type: 'gift_received',
      titleAr: 'وصلتك هدية بريميوم!',
      titleEn: 'You Received a VIP Gift!',
      messageAr:
        targetType === 'book'
          ? `أهداك ${senderUser.displayName} الكتاب البريميوم «${itemTitleAr}» وأصبح متاحاً في حسابك الآن.`
          : `أهداك ${senderUser.displayName} السمة البريميوم «${itemTitleAr}» وأصبحت متاحة في حسابك الآن.`,
      messageEn:
        targetType === 'book'
          ? `${senderUser.displayName} gifted you the premium book "${itemTitleEn}". It is now unlocked on your account.`
          : `${senderUser.displayName} gifted you the premium theme "${itemTitleEn}". It is now unlocked on your account.`,
      targetBookId: targetType === 'book' ? targetId : null,
      targetUserUid: senderUid,
    });

    return { ok: true, itemLabel: itemTitleAr };
  } catch (error) {
    console.error('Database error in transferPremiumGift:', error);
    throw new Error('Failed to transfer premium gift.', { cause: error });
  }
}

type DbExecutor = Pick<typeof db, 'select' | 'insert' | 'delete' | 'update'>;

async function resolveTradableItemMeta(
  itemType: 'book' | 'theme',
  itemId: string
): Promise<{ ok: true; titleAr: string; titleEn: string } | { ok: false; error: string }> {
  if (itemType === 'book') {
    const [book] = await db.select().from(books).where(eq(books.id, itemId)).limit(1);
    if (!book || !book.isPremium || book.reviewStatus !== 'approved') {
      return { ok: false, error: 'Premium book not found.' };
    }
    if (book.isComingSoon) {
      return { ok: false, error: 'Coming soon books cannot be traded yet.' };
    }
    return { ok: true, titleAr: book.title, titleEn: book.title };
  }
  const [themeRow] = await db
    .select()
    .from(premiumThemes)
    .where(eq(premiumThemes.id, itemId))
    .limit(1);
  if (!themeRow) {
    return { ok: false, error: 'Premium theme not found.' };
  }
  const themeDef = THEME_CATALOG.find((t) => t.id === itemId);
  return {
    ok: true,
    titleAr: themeDef?.name ?? itemId,
    titleEn: themeDef?.nameEn ?? itemId,
  };
}

type OwnershipStatus =
  | { kind: 'permanent'; purchasedAt: Date; grantedBy: string }
  | { kind: 'code'; codeSnapshot: string; expiresAt: Date }
  | null;

async function getItemOwnership(
  exec: DbExecutor,
  userUid: string,
  itemType: 'book' | 'theme',
  itemId: string
): Promise<OwnershipStatus> {
  if (itemType === 'book') {
    const [perm] = await exec
      .select()
      .from(userBookPurchases)
      .where(and(eq(userBookPurchases.userUid, userUid), eq(userBookPurchases.bookId, itemId)))
      .limit(1);
    if (perm) {
      return { kind: 'permanent', purchasedAt: perm.purchasedAt, grantedBy: perm.grantedBy };
    }
  } else {
    const [perm] = await exec
      .select()
      .from(userThemePurchases)
      .where(and(eq(userThemePurchases.userUid, userUid), eq(userThemePurchases.themeId, itemId)))
      .limit(1);
    if (perm) {
      return { kind: 'permanent', purchasedAt: perm.purchasedAt, grantedBy: perm.grantedBy };
    }
  }

  const [grant] = await exec
    .select()
    .from(userCodeGrants)
    .where(
      and(
        eq(userCodeGrants.userUid, userUid),
        eq(userCodeGrants.targetType, itemType),
        eq(userCodeGrants.targetId, itemId)
      )
    )
    .limit(1);
  if (grant) {
    return { kind: 'code', codeSnapshot: grant.codeSnapshot, expiresAt: grant.expiresAt };
  }
  return null;
}

async function moveOwnedItemInTx(
  tx: DbExecutor,
  fromUid: string,
  toUid: string,
  itemType: 'book' | 'theme',
  itemId: string,
  ownership: Exclude<OwnershipStatus, null>,
  now: Date
): Promise<void> {
  if (itemType === 'book') {
    await tx
      .delete(userBookPurchases)
      .where(and(eq(userBookPurchases.userUid, fromUid), eq(userBookPurchases.bookId, itemId)));
    await tx
      .delete(userCodeGrants)
      .where(
        and(
          eq(userCodeGrants.userUid, fromUid),
          eq(userCodeGrants.targetType, 'book'),
          eq(userCodeGrants.targetId, itemId)
        )
      );
    await tx
      .delete(userCodeGrants)
      .where(
        and(
          eq(userCodeGrants.userUid, toUid),
          eq(userCodeGrants.targetType, 'book'),
          eq(userCodeGrants.targetId, itemId)
        )
      );

    if (ownership.kind === 'permanent') {
      await tx
        .insert(userBookPurchases)
        .values({
          userUid: toUid,
          bookId: itemId,
          grantedBy: `trade:${fromUid}`,
        })
        .onConflictDoNothing();
    } else {
      await tx
        .insert(userCodeGrants)
        .values({
          userUid: toUid,
          targetType: 'book',
          targetId: itemId,
          codeSnapshot: ownership.codeSnapshot,
          grantedAt: now,
          expiresAt: ownership.expiresAt,
        })
        .onConflictDoUpdate({
          target: [userCodeGrants.userUid, userCodeGrants.targetType, userCodeGrants.targetId],
          set: {
            codeSnapshot: ownership.codeSnapshot,
            grantedAt: now,
            expiresAt: ownership.expiresAt,
          },
        });
    }
    return;
  }

  await tx
    .delete(userThemePurchases)
    .where(and(eq(userThemePurchases.userUid, fromUid), eq(userThemePurchases.themeId, itemId)));
  await tx
    .delete(userCodeGrants)
    .where(
      and(
        eq(userCodeGrants.userUid, fromUid),
        eq(userCodeGrants.targetType, 'theme'),
        eq(userCodeGrants.targetId, itemId)
      )
    );
  await tx
    .delete(userCodeGrants)
    .where(
      and(
        eq(userCodeGrants.userUid, toUid),
        eq(userCodeGrants.targetType, 'theme'),
        eq(userCodeGrants.targetId, itemId)
      )
    );

  if (ownership.kind === 'permanent') {
    await tx
      .insert(userThemePurchases)
      .values({
        userUid: toUid,
        themeId: itemId,
        grantedBy: `trade:${fromUid}`,
      })
      .onConflictDoNothing();
  } else {
    await tx
      .insert(userCodeGrants)
      .values({
        userUid: toUid,
        targetType: 'theme',
        targetId: itemId,
        codeSnapshot: ownership.codeSnapshot,
        grantedAt: now,
        expiresAt: ownership.expiresAt,
      })
      .onConflictDoUpdate({
        target: [userCodeGrants.userUid, userCodeGrants.targetType, userCodeGrants.targetId],
        set: {
          codeSnapshot: ownership.codeSnapshot,
          grantedAt: now,
          expiresAt: ownership.expiresAt,
        },
      });
  }
}

export async function createTradeRequest(
  senderUid: string,
  input: {
    recipientUid: string;
    offeredType: 'book' | 'theme';
    offeredId: string;
    requestedType: 'book' | 'theme';
    requestedId: string;
  }
): Promise<{ ok: boolean; error?: string; tradeId?: string }> {
  try {
    const recipientUid = input.recipientUid.trim();
    const offeredId = input.offeredId.trim();
    const requestedId = input.requestedId.trim();

    if (!recipientUid || recipientUid === senderUid) {
      return { ok: false, error: 'اختر حساب صديق آخر لإرسال طلب التبديل إليه.' };
    }
    if (input.offeredType === input.requestedType && offeredId === requestedId) {
      return { ok: false, error: 'لا يمكن تبديل نفس العنصر بنفسه.' };
    }

    const [[senderUser], [recipientUser], offeredMeta, requestedMeta] = await Promise.all([
      db
        .select({ uid: users.uid, displayName: users.displayName })
        .from(users)
        .where(eq(users.uid, senderUid))
        .limit(1),
      db
        .select({ uid: users.uid, displayName: users.displayName })
        .from(users)
        .where(eq(users.uid, recipientUid))
        .limit(1),
      resolveTradableItemMeta(input.offeredType, offeredId),
      resolveTradableItemMeta(input.requestedType, requestedId),
    ]);

    if (!senderUser || !recipientUser) {
      return { ok: false, error: 'تعذر العثور على الحساب المطلوب.' };
    }
    if (!offeredMeta.ok) {
      return { ok: false, error: offeredMeta.error };
    }
    if (!requestedMeta.ok) {
      return { ok: false, error: requestedMeta.error };
    }

    const [senderOwnsOffered, senderOwnsRequested, recipientOwnsRequested, recipientOwnsOffered] =
      await Promise.all([
        getItemOwnership(db, senderUid, input.offeredType, offeredId),
        getItemOwnership(db, senderUid, input.requestedType, requestedId),
        getItemOwnership(db, recipientUid, input.requestedType, requestedId),
        getItemOwnership(db, recipientUid, input.offeredType, offeredId),
      ]);

    if (!senderOwnsOffered) {
      return { ok: false, error: 'لا تمتلك العنصر البريميوم الذي اخترت عرضه.' };
    }
    if (senderOwnsRequested) {
      return { ok: false, error: 'أنت تمتلك العنصر المطلوب بالفعل.' };
    }
    if (!recipientOwnsRequested) {
      return { ok: false, error: 'الصديق المحدد لم يعد يمتلك هذا العنصر البريميوم.' };
    }
    if (recipientOwnsOffered) {
      return { ok: false, error: 'هذا الصديق يمتلك العنصر الذي تعرضه بالفعل.' };
    }

    const [duplicate] = await db
      .select({ id: premiumTradeRequests.id })
      .from(premiumTradeRequests)
      .where(
        and(
          eq(premiumTradeRequests.status, 'pending'),
          eq(premiumTradeRequests.senderUid, senderUid),
          eq(premiumTradeRequests.recipientUid, recipientUid),
          eq(premiumTradeRequests.offeredType, input.offeredType),
          eq(premiumTradeRequests.offeredId, offeredId),
          eq(premiumTradeRequests.requestedType, input.requestedType),
          eq(premiumTradeRequests.requestedId, requestedId)
        )
      )
      .limit(1);

    if (duplicate) {
      return { ok: false, error: 'لديك طلب تبديل معلق مطابق بالفعل لهذا الصديق.' };
    }

    const tradeId = `trade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await db.insert(premiumTradeRequests).values({
      id: tradeId,
      senderUid,
      recipientUid,
      offeredType: input.offeredType,
      offeredId,
      requestedType: input.requestedType,
      requestedId,
      status: 'pending',
    });

    await createUserNotification({
      userUid: recipientUid,
      type: 'trade_request',
      titleAr: 'طلب تبديل بريميوم جديد!',
      titleEn: 'New Premium Trade Request!',
      messageAr: `يطلب ${senderUser.displayName} مبادلة «${offeredMeta.titleAr}» مقابل «${requestedMeta.titleAr}» لديك. يمكنك الموافقة أو الرفض من حسابك.`,
      messageEn: `${senderUser.displayName} wants to trade "${offeredMeta.titleEn}" for your "${requestedMeta.titleEn}". Accept or decline from your profile.`,
      targetBookId: null,
      targetUserUid: senderUid,
      targetView: 'you',
      targetSection: 'trade-requests',
    });

    return { ok: true, tradeId };
  } catch (error) {
    console.error('Database error in createTradeRequest:', error);
    throw new Error('Failed to create trade request.', { cause: error });
  }
}

export async function respondToTradeRequest(
  userUid: string,
  tradeId: string,
  decision: 'accept' | 'decline' | 'cancel'
): Promise<{ ok: boolean; error?: string; status?: 'accepted' | 'declined' | 'cancelled' }> {
  try {
    const [trade] = await db
      .select()
      .from(premiumTradeRequests)
      .where(eq(premiumTradeRequests.id, tradeId))
      .limit(1);

    if (!trade) {
      return { ok: false, error: 'لم يتم العثور على طلب التبديل.' };
    }
    if (trade.status !== 'pending') {
      return { ok: false, error: 'تم الرد على طلب التبديل هذا مسبقاً.' };
    }

    const now = new Date();
    const [[senderUser], [recipientUser], offeredMeta, requestedMeta] = await Promise.all([
      db
        .select({ uid: users.uid, displayName: users.displayName })
        .from(users)
        .where(eq(users.uid, trade.senderUid))
        .limit(1),
      db
        .select({ uid: users.uid, displayName: users.displayName })
        .from(users)
        .where(eq(users.uid, trade.recipientUid))
        .limit(1),
      resolveTradableItemMeta(trade.offeredType === 'theme' ? 'theme' : 'book', trade.offeredId),
      resolveTradableItemMeta(trade.requestedType === 'theme' ? 'theme' : 'book', trade.requestedId),
    ]);

    const offeredLabelAr = offeredMeta.ok ? offeredMeta.titleAr : trade.offeredId;
    const offeredLabelEn = offeredMeta.ok ? offeredMeta.titleEn : trade.offeredId;
    const requestedLabelAr = requestedMeta.ok ? requestedMeta.titleAr : trade.requestedId;
    const requestedLabelEn = requestedMeta.ok ? requestedMeta.titleEn : trade.requestedId;

    if (decision === 'cancel') {
      if (trade.senderUid !== userUid) {
        return { ok: false, error: 'فقط مرسل الطلب يمكنه إلغاؤه.' };
      }
      await db
        .update(premiumTradeRequests)
        .set({ status: 'cancelled', respondedAt: now })
        .where(and(eq(premiumTradeRequests.id, tradeId), eq(premiumTradeRequests.status, 'pending')));
      return { ok: true, status: 'cancelled' };
    }

    if (trade.recipientUid !== userUid) {
      return { ok: false, error: 'ليس لديك صلاحية للرد على هذا الطلب.' };
    }

    if (decision === 'decline') {
      await db
        .update(premiumTradeRequests)
        .set({ status: 'declined', respondedAt: now })
        .where(and(eq(premiumTradeRequests.id, tradeId), eq(premiumTradeRequests.status, 'pending')));

      await createUserNotification({
        userUid: trade.senderUid,
        type: 'trade_declined',
        titleAr: 'تم رفض طلب التبديل',
        titleEn: 'Trade Request Declined',
        messageAr: `رفض ${recipientUser?.displayName ?? 'الصديق'} طلب تبديل «${offeredLabelAr}» مقابل «${requestedLabelAr}».`,
        messageEn: `${recipientUser?.displayName ?? 'Your friend'} declined the trade of "${offeredLabelEn}" for "${requestedLabelEn}".`,
        targetBookId: null,
        targetUserUid: trade.recipientUid,
        targetView: 'you',
        targetSection: 'trade-requests',
      });
      return { ok: true, status: 'declined' };
    }

    const offeredType: 'book' | 'theme' = trade.offeredType === 'theme' ? 'theme' : 'book';
    const requestedType: 'book' | 'theme' = trade.requestedType === 'theme' ? 'theme' : 'book';

    const txResult = await db.transaction(async (tx): Promise<{ ok: boolean; error?: string }> => {
      const [freshTrade] = await tx
        .select()
        .from(premiumTradeRequests)
        .where(eq(premiumTradeRequests.id, tradeId))
        .limit(1);
      if (!freshTrade || freshTrade.status !== 'pending') {
        return { ok: false, error: 'تم الرد على طلب التبديل هذا مسبقاً.' };
      }

      const [senderOwnsOffered, senderOwnsRequested, recipientOwnsRequested, recipientOwnsOffered] =
        await Promise.all([
          getItemOwnership(tx, trade.senderUid, offeredType, trade.offeredId),
          getItemOwnership(tx, trade.senderUid, requestedType, trade.requestedId),
          getItemOwnership(tx, trade.recipientUid, requestedType, trade.requestedId),
          getItemOwnership(tx, trade.recipientUid, offeredType, trade.offeredId),
        ]);

      if (!senderOwnsOffered) {
        await tx
          .update(premiumTradeRequests)
          .set({ status: 'cancelled', respondedAt: now })
          .where(eq(premiumTradeRequests.id, tradeId));
        return { ok: false, error: 'مرسل الطلب لم يعد يمتلك العنصر المعروض.' };
      }
      if (!recipientOwnsRequested) {
        await tx
          .update(premiumTradeRequests)
          .set({ status: 'cancelled', respondedAt: now })
          .where(eq(premiumTradeRequests.id, tradeId));
        return { ok: false, error: 'لم تعد تمتلك العنصر المطلوب للتبديل.' };
      }
      if (senderOwnsRequested || recipientOwnsOffered) {
        await tx
          .update(premiumTradeRequests)
          .set({ status: 'cancelled', respondedAt: now })
          .where(eq(premiumTradeRequests.id, tradeId));
        return { ok: false, error: 'أحد الطرفين يمتلك العنصر المقابل بالفعل.' };
      }

      await moveOwnedItemInTx(
        tx,
        trade.senderUid,
        trade.recipientUid,
        offeredType,
        trade.offeredId,
        senderOwnsOffered,
        now
      );
      await moveOwnedItemInTx(
        tx,
        trade.recipientUid,
        trade.senderUid,
        requestedType,
        trade.requestedId,
        recipientOwnsRequested,
        now
      );

      await tx
        .update(premiumTradeRequests)
        .set({ status: 'accepted', respondedAt: now })
        .where(eq(premiumTradeRequests.id, tradeId));

      // Cancel conflicting pending trades involving the swapped items
      const pendingRelated = await tx
        .select({
          id: premiumTradeRequests.id,
          senderUid: premiumTradeRequests.senderUid,
          recipientUid: premiumTradeRequests.recipientUid,
          offeredType: premiumTradeRequests.offeredType,
          offeredId: premiumTradeRequests.offeredId,
          requestedType: premiumTradeRequests.requestedType,
          requestedId: premiumTradeRequests.requestedId,
        })
        .from(premiumTradeRequests)
        .where(eq(premiumTradeRequests.status, 'pending'));

      const conflictingIds = pendingRelated
        .filter((p) => {
          if (p.id === tradeId) return false;
          const touchesSenderOffer =
            (p.senderUid === trade.senderUid &&
              p.offeredType === offeredType &&
              p.offeredId === trade.offeredId) ||
            (p.recipientUid === trade.senderUid &&
              p.requestedType === offeredType &&
              p.requestedId === trade.offeredId) ||
            (p.senderUid === trade.senderUid &&
              p.requestedType === requestedType &&
              p.requestedId === trade.requestedId);
          const touchesRecipientItem =
            (p.senderUid === trade.recipientUid &&
              p.offeredType === requestedType &&
              p.offeredId === trade.requestedId) ||
            (p.recipientUid === trade.recipientUid &&
              p.requestedType === requestedType &&
              p.requestedId === trade.requestedId) ||
            (p.senderUid === trade.recipientUid &&
              p.requestedType === offeredType &&
              p.requestedId === trade.offeredId);
          return touchesSenderOffer || touchesRecipientItem;
        })
        .map((p) => p.id);

      if (conflictingIds.length > 0) {
        await tx
          .update(premiumTradeRequests)
          .set({ status: 'cancelled', respondedAt: now })
          .where(inArray(premiumTradeRequests.id, conflictingIds));
      }

      return { ok: true };
    });

    if (!txResult.ok) {
      return { ok: false, error: txResult.error };
    }

    await createUserNotification({
      userUid: trade.senderUid,
      type: 'trade_accepted',
      titleAr: 'تمت الموافقة على التبديل بنجاح!',
      titleEn: 'Premium Trade Accepted!',
      messageAr: `وافق ${recipientUser?.displayName ?? 'الصديق'} على تبديل «${offeredLabelAr}» مقابل «${requestedLabelAr}»، وأصبح متاحاً في حسابك الآن.`,
      messageEn: `${recipientUser?.displayName ?? 'Your friend'} accepted your trade of "${offeredLabelEn}" for "${requestedLabelEn}". It is now unlocked on your account!`,
      targetBookId: null,
      targetUserUid: trade.recipientUid,
      targetView: 'you',
      targetSection: 'trade-requests',
    });

    return { ok: true, status: 'accepted' };
  } catch (error) {
    console.error('Database error in respondToTradeRequest:', error);
    throw new Error('Failed to respond to trade request.', { cause: error });
  }
}
