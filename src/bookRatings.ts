export const DEFAULT_BOOK_RATING = 0;

export const BOOK_RATINGS: Record<string, { rating: number }> = {};

export function clampBookRating(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_BOOK_RATING;
  return Math.min(5, Math.max(0, Math.round(value * 10) / 10));
}

export function calculateReviewsAverage(
  reviews?: Array<{ rating: number }> | null
): number {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + (Number.isFinite(r.rating) ? r.rating : 0), 0);
  return clampBookRating(sum / reviews.length);
}

export function getBookRating(book: {
  id: string;
  rating?: number;
  reviews?: Array<{ rating: number }>;
}): number {
  if (Array.isArray(book.reviews)) {
    return calculateReviewsAverage(book.reviews);
  }
  if (typeof book.rating === 'number' && Number.isFinite(book.rating)) {
    return clampBookRating(book.rating);
  }
  const configured = BOOK_RATINGS[book.id]?.rating;
  if (typeof configured === 'number' && Number.isFinite(configured)) {
    return clampBookRating(configured);
  }
  return DEFAULT_BOOK_RATING;
}
