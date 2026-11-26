import type { ChapterRow } from './schema.ts';

export interface SeedSection {
  name: string;
  englishName: string;
  sortOrder: number;
}

export interface SeedBook {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  category: string;
  year: number;
  pages: number;
  readingMinutes: number;
  rating: number;
  version: number;
  updatedAt: string;
  addedAt: string | null;
  featured: boolean;
  isPremium: boolean;
  priceLabel: string;
  rotatingCode: string | null;
  rotationHours: number;
  bookType: 'text' | 'pdf' | 'word';
  pdfId: string | null;
  pdfPageCount: number | null;
  coverUrl: string;
  synopsis: string;
  chapters: ChapterRow[];
}

export const INITIAL_SECTIONS: SeedSection[] = [
  { name: 'العلوم', englishName: 'Science', sortOrder: 1 },
  { name: 'الأدب', englishName: 'Literature', sortOrder: 2 },
  { name: 'التاريخ', englishName: 'History', sortOrder: 3 },
];

export const INITIAL_PREMIUM_THEME_CODES: Array<{ id: string; initialCode: string }> = [
  { id: 'golden-king', initialCode: '8492031765' },
  { id: 'mamluk-gold', initialCode: '7492018356' },
  { id: 'phoenician-marble', initialCode: '3829104752' },
  { id: 'damascus-pearl', initialCode: '8319462057' },
  { id: 'andalus-cobalt', initialCode: '6154920837' },
  { id: 'emerald-manuscript', initialCode: '9047281635' },
  { id: 'crimson-velvet', initialCode: '5183920467' },
  { id: 'nebula-amethyst', initialCode: '2947105836' },
  { id: 'abyssal-teal', initialCode: '6730491825' },
  { id: 'pharaoh-onyx', initialCode: '4091827365' },
];

export const INITIAL_BOOKS: SeedBook[] = [];
