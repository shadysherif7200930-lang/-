import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export interface ChapterRow {
  id: string;
  number: string;
  title: string;
  epigraph?: string;
  paragraphs: string[];
}

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull().default('Reader'),
  isVerified: boolean('is_verified').notNull().default(false),
  tokensBalance: integer('tokens_balance').notNull().default(0),
  activeIconId: text('active_icon_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const librarySections = pgTable('library_sections', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  englishName: text('english_name'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const books = pgTable('books', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull().default(''),
  author: text('author').notNull(),
  authorUid: text('author_uid'),
  isAuthorVerified: boolean('is_author_verified').notNull().default(false),
  category: text('category').notNull().default('عام'),
  year: integer('year').notNull().default(2026),
  pages: integer('pages').notNull().default(80),
  readingMinutes: integer('reading_minutes').notNull().default(12),
  rating: doublePrecision('rating').notNull().default(0),
  version: integer('version').notNull().default(1),
  updatedAt: text('updated_at').notNull(),
  addedAt: text('added_at'),
  featured: boolean('featured').notNull().default(false),
  isComingSoon: boolean('is_coming_soon').notNull().default(false),
  comingSoonMode: text('coming_soon_mode'),
  comingSoonReleaseAt: text('coming_soon_release_at'),
  isPremium: boolean('is_premium').notNull().default(false),
  priceLabel: text('price_label').notNull().default('$4.99'),
  tokenPrice: integer('token_price'),
  discountPercent: integer('discount_percent'),
  discountStartedAt: timestamp('discount_started_at'),
  discountEndsAt: timestamp('discount_ends_at'),
  discountPostReleaseDays: integer('discount_post_release_days'),
  pendingTokenPrice: integer('pending_token_price'),
  priceReviewStatus: text('price_review_status'),
  priceReviewNote: text('price_review_note'),
  priceSubmittedAt: timestamp('price_submitted_at'),
  publishTokensPaid: integer('publish_tokens_paid').notNull().default(0),
  rotatingCode: text('rotating_code'),
  codeRotatedAt: timestamp('code_rotated_at'),
  codeExpiresAt: timestamp('code_expires_at'),
  rotationHours: integer('rotation_hours').notNull().default(24),
  bookType: text('book_type').notNull().default('text'),
  pdfId: text('pdf_id'),
  pdfPageCount: integer('pdf_page_count'),
  coverUrl: text('cover_url').notNull(),
  synopsis: text('synopsis').notNull().default(''),
  chaptersJson: jsonb('chapters_json').$type<ChapterRow[]>().notNull().default([]),
  reviewStatus: text('review_status').notNull().default('approved'),
  reviewNote: text('review_note'),
  submittedAt: timestamp('submitted_at'),
  seriesId: text('series_id'),
  seriesTitle: text('series_title'),
  partNumber: integer('part_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bookReviews = pgTable('book_reviews', {
  id: text('id').primaryKey(),
  bookId: text('book_id')
    .notNull()
    .references(() => books.id, { onDelete: 'cascade' }),
  reviewerUid: text('reviewer_uid'),
  reviewerName: text('reviewer_name').notNull(),
  rating: doublePrecision('rating').notNull(),
  comment: text('comment').notNull(),
  isVerified: boolean('is_verified').notNull().default(false),
  isOwner: boolean('is_owner').notNull().default(false),
  moderationStatus: text('moderation_status').notNull().default('approved'),
  moderationNote: text('moderation_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bookReviewLikes = pgTable(
  'book_review_likes',
  {
    id: serial('id').primaryKey(),
    reviewId: text('review_id')
      .notNull()
      .references(() => bookReviews.id, { onDelete: 'cascade' }),
    userUid: text('user_uid')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('book_review_likes_review_user_idx').on(table.reviewId, table.userUid),
  ]
);

export const bookDocuments = pgTable('book_documents', {
  id: text('id').primaryKey(),
  bookId: text('book_id').notNull(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  dataBase64: text('data_base64').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const premiumThemes = pgTable('premium_themes', {
  id: text('id').primaryKey(),
  rotatingCode: text('rotating_code').notNull(),
  codeRotatedAt: timestamp('code_rotated_at').defaultNow().notNull(),
  codeExpiresAt: timestamp('code_expires_at').notNull(),
  rotationHours: integer('rotation_hours').notNull().default(24),
  tokenPrice: integer('token_price'),
});

export const premiumIcons = pgTable('premium_icons', {
  id: text('id').primaryKey(),
  rotatingCode: text('rotating_code').notNull(),
  codeRotatedAt: timestamp('code_rotated_at').defaultNow().notNull(),
  codeExpiresAt: timestamp('code_expires_at').notNull(),
  rotationHours: integer('rotation_hours').notNull().default(24),
  tokenPrice: integer('token_price'),
});

export const userBookPurchases = pgTable(
  'user_book_purchases',
  {
    id: serial('id').primaryKey(),
    userUid: text('user_uid')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    bookId: text('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    purchasedAt: timestamp('purchased_at').defaultNow().notNull(),
    grantedBy: text('granted_by').notNull().default('checkout'),
  },
  (table) => [uniqueIndex('user_book_purchases_uid_book_idx').on(table.userUid, table.bookId)]
);

export const userThemePurchases = pgTable(
  'user_theme_purchases',
  {
    id: serial('id').primaryKey(),
    userUid: text('user_uid')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    themeId: text('theme_id').notNull(),
    purchasedAt: timestamp('purchased_at').defaultNow().notNull(),
    grantedBy: text('granted_by').notNull().default('checkout'),
  },
  (table) => [uniqueIndex('user_theme_purchases_uid_theme_idx').on(table.userUid, table.themeId)]
);

export const userIconPurchases = pgTable(
  'user_icon_purchases',
  {
    id: serial('id').primaryKey(),
    userUid: text('user_uid')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    iconId: text('icon_id').notNull(),
    purchasedAt: timestamp('purchased_at').defaultNow().notNull(),
    grantedBy: text('granted_by').notNull().default('checkout'),
  },
  (table) => [uniqueIndex('user_icon_purchases_uid_icon_idx').on(table.userUid, table.iconId)]
);

export const userCodeGrants = pgTable(
  'user_code_grants',
  {
    id: serial('id').primaryKey(),
    userUid: text('user_uid')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    targetType: text('target_type').notNull(), // 'book' | 'theme' | 'icon'
    targetId: text('target_id').notNull(),
    codeSnapshot: text('code_snapshot').notNull(),
    grantedAt: timestamp('granted_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => [
    uniqueIndex('user_code_grants_uid_target_idx').on(
      table.userUid,
      table.targetType,
      table.targetId
    ),
  ]
);

export const readingProgress = pgTable(
  'reading_progress',
  {
    id: serial('id').primaryKey(),
    userUid: text('user_uid')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    bookId: text('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    chapterIndex: integer('chapter_index').notNull().default(0),
    scrollRatio: doublePrecision('scroll_ratio').notNull().default(0),
    bookmarksJson: jsonb('bookmarks_json').$type<number[]>().notNull().default([]),
    lastReadAt: text('last_read_at').notNull(),
  },
  (table) => [uniqueIndex('reading_progress_uid_book_idx').on(table.userUid, table.bookId)]
);

export const userFollows = pgTable(
  'user_follows',
  {
    id: serial('id').primaryKey(),
    followerUid: text('follower_uid')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    targetUid: text('target_uid')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_follows_follower_target_idx').on(table.followerUid, table.targetUid),
  ]
);

export const userNotifications = pgTable(
  'user_notifications',
  {
    id: text('id').primaryKey(),
    userUid: text('user_uid')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    titleAr: text('title_ar').notNull(),
    titleEn: text('title_en').notNull(),
    messageAr: text('message_ar').notNull(),
    messageEn: text('message_en').notNull(),
    targetBookId: text('target_book_id'),
    targetUserUid: text('target_user_uid'),
    targetView: text('target_view'),
    targetSection: text('target_section'),
    dedupeKey: text('dedupe_key'),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_notifications_uid_dedupe_idx').on(table.userUid, table.dedupeKey),
  ]
);

export const comingSoonAlerts = pgTable(
  'coming_soon_alerts',
  {
    id: serial('id').primaryKey(),
    userUid: text('user_uid')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    bookId: text('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('coming_soon_alerts_uid_book_idx').on(table.userUid, table.bookId),
  ]
);

export const bookPreorders = pgTable(
  'book_preorders',
  {
    id: serial('id').primaryKey(),
    userUid: text('user_uid')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    bookId: text('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    tokensPaid: integer('tokens_paid').notNull().default(0),
    discountPercentSnapshot: integer('discount_percent_snapshot'),
    status: text('status').notNull().default('pending'),
    fulfilledAt: timestamp('fulfilled_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('book_preorders_uid_book_idx').on(table.userUid, table.bookId),
  ]
);

export const catalogMeta = pgTable('catalog_meta', {
  key: text('key').primaryKey(),
  valueJson: jsonb('value_json').$type<Record<string, unknown>>().notNull(),
});

export const premiumTradeRequests = pgTable('premium_trade_requests', {
  id: text('id').primaryKey(),
  senderUid: text('sender_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  recipientUid: text('recipient_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  offeredType: text('offered_type').notNull(),
  offeredId: text('offered_id').notNull(),
  requestedType: text('requested_type').notNull(),
  requestedId: text('requested_id').notNull(),
  status: text('status').notNull().default('pending'),
  respondedAt: timestamp('responded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tokenTransactions = pgTable(
  'token_transactions',
  {
    id: text('id').primaryKey(),
    userUid: text('user_uid')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    kind: text('kind').notNull(),
    descriptionAr: text('description_ar').notNull(),
    descriptionEn: text('description_en').notNull(),
    targetBookId: text('target_book_id'),
    targetThemeId: text('target_theme_id'),
    dedupeKey: text('dedupe_key'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('token_transactions_uid_dedupe_idx').on(table.userUid, table.dedupeKey),
  ]
);

export const usersRelations = relations(users, ({ many }) => ({
  bookPurchases: many(userBookPurchases),
  themePurchases: many(userThemePurchases),
  iconPurchases: many(userIconPurchases),
  codeGrants: many(userCodeGrants),
  progressEntries: many(readingProgress),
  comingSoonAlerts: many(comingSoonAlerts),
  bookPreorders: many(bookPreorders),
}));

export const booksRelations = relations(books, ({ many }) => ({
  purchases: many(userBookPurchases),
  progressEntries: many(readingProgress),
  reviews: many(bookReviews),
  comingSoonAlerts: many(comingSoonAlerts),
  preorders: many(bookPreorders),
}));

export const bookReviewsRelations = relations(bookReviews, ({ one }) => ({
  book: one(books, {
    fields: [bookReviews.bookId],
    references: [books.id],
  }),
}));
