export interface ChapterData {
  url: string;
  bookTitle: string;
  chapterTitle: string;
  chapterNo: string;
  chapterName: string;
  paragraphs: string[];
  formattedTxt: string;
  charCount: number;
  paragraphCount: number;
  prevUrl: string | null;
  nextUrl: string | null;
  catalogUrl: string | null;
  cached?: boolean;
}

export interface CatalogItem {
  title: string;
  url: string;
  chapterNo: string;
}

export interface CatalogData {
  bookTitle: string;
  author: string;
  catalogUrl: string;
  totalChapters: number;
  chapters: CatalogItem[];
}

export type ThemeMode = 'parchment' | 'dark' | 'black' | 'light' | 'green';

export type HeaderFormat = 'standard' | 'bracketed' | 'prefixed' | 'markdown' | 'decorative';

export type IndentStyle = 'chinese' | 'none' | 'tab' | 'spaces';

export interface FormatOptions {
  headerFormat: HeaderFormat;
  indentStyle: IndentStyle;
  doubleNewline: boolean;
  includeBookTitle: boolean;
  includeChapterDivider: boolean;
  ensureEndingPunctuation: boolean;
  endingPunctuationChar: string;
}

export interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: 'serif' | 'sans' | 'kaiti';
  theme: ThemeMode;
  maxWidth: 'narrow' | 'medium' | 'wide';
}

export interface BatchItem {
  index: number;
  url: string;
  title: string;
  chapterNo: string;
  status: 'pending' | 'fetching' | 'completed' | 'error';
  error?: string;
  chapterData?: ChapterData;
}
