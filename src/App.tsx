import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { UrlBar } from './components/UrlBar';
import { TxtPreview } from './components/TxtPreview';
import { ReaderView } from './components/ReaderView';
import { CatalogModal } from './components/CatalogModal';
import { BatchModal } from './components/BatchModal';
import { SettingsModal } from './components/SettingsModal';
import {
  ChapterData,
  CatalogData,
  FormatOptions,
  ReaderSettings,
  ThemeMode,
} from './types';
import { formatChapterToTxt, downloadTxtFile, sanitizeFilename } from './utils/formatter';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const INITIAL_TARGET_URL = 'https://uukanshu.cc/book/27548/17878356.html';

const STORAGE_KEYS = {
  LAST_CHAPTER_URL: 'uu_last_chapter_url',
  LAST_CHAPTER_TITLE: 'uu_last_chapter_title',
  VIEW_MODE: 'uu_view_mode',
  THEME: 'uu_theme',
  FORMAT_OPTIONS: 'uu_format_options',
  READER_SETTINGS: 'uu_reader_settings',
};

function getStoredUrl(): string {
  if (typeof window === 'undefined') return INITIAL_TARGET_URL;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_CHAPTER_URL);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {
    // fallback
  }
  return INITIAL_TARGET_URL;
}

function getStoredViewMode(): 'txt' | 'reader' {
  if (typeof window === 'undefined') return 'txt';
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.VIEW_MODE);
    if (saved === 'txt' || saved === 'reader') return saved;
  } catch (e) {}
  return 'txt';
}

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'parchment';
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved && ['parchment', 'dark', 'black', 'light', 'green'].includes(saved)) {
      return saved as ThemeMode;
    }
  } catch (e) {}
  return 'parchment';
}

const DEFAULT_FORMAT_OPTIONS: FormatOptions = {
  headerFormat: 'standard',
  indentStyle: 'chinese',
  doubleNewline: true,
  includeBookTitle: false,
  includeChapterDivider: false,
  ensureEndingPunctuation: true,
  endingPunctuationChar: '。',
};

function getStoredFormatOptions(): FormatOptions {
  if (typeof window === 'undefined') return DEFAULT_FORMAT_OPTIONS;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.FORMAT_OPTIONS);
    if (saved) {
      return { ...DEFAULT_FORMAT_OPTIONS, ...JSON.parse(saved) };
    }
  } catch (e) {}
  return DEFAULT_FORMAT_OPTIONS;
}

const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: 'serif',
  theme: 'parchment',
  maxWidth: 'medium',
};

function getStoredReaderSettings(): ReaderSettings {
  if (typeof window === 'undefined') return DEFAULT_READER_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.READER_SETTINGS);
    if (saved) {
      return { ...DEFAULT_READER_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {}
  return DEFAULT_READER_SETTINGS;
}

export default function App() {
  // Start with the remembered last chapter URL (or Chapter 41 if first visit)
  const [currentUrl, setCurrentUrl] = useState<string>(() => getStoredUrl());
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [catalogLoading, setCatalogLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // View & Theme States with persistence
  const [viewMode, setViewMode] = useState<'txt' | 'reader'>(() => getStoredViewMode());
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());

  // Modals
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Formatting & Reader Settings with persistence
  const [formatOptions, setFormatOptions] = useState<FormatOptions>(() => getStoredFormatOptions());
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(() => getStoredReaderSettings());

  // Save preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
    } catch (e) {}
  }, [viewMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {}
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FORMAT_OPTIONS, JSON.stringify(formatOptions));
    } catch (e) {}
  }, [formatOptions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.READER_SETTINGS, JSON.stringify(readerSettings));
    } catch (e) {}
  }, [readerSettings]);

  // Fetch Chapter Function
  const fetchChapter = useCallback(async (targetUrl: string = currentUrl) => {
    if (!targetUrl) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/chapter?url=${encodeURIComponent(targetUrl)}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to read chapter content');
      }
      setChapterData(data);
      const finalUrl = data.url || targetUrl;
      setCurrentUrl(finalUrl);

      // Persist the last read chapter URL so reloading opens this chapter
      try {
        localStorage.setItem(STORAGE_KEYS.LAST_CHAPTER_URL, finalUrl);
        if (data.chapterTitle) {
          localStorage.setItem(STORAGE_KEYS.LAST_CHAPTER_TITLE, data.chapterTitle);
        }
      } catch (err) {
        console.warn('Failed to save last chapter to localStorage:', err);
      }

      // If catalog not loaded yet, fetch book catalog
      if (data.catalogUrl && !catalog) {
        loadCatalog(data.catalogUrl);
      }
    } catch (err: any) {
      console.error('Fetch chapter failed:', err);
      setError(err.message || 'Failed to load chapter. Please verify your connection or try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUrl, catalog]);

  // Load Book Catalog
  const loadCatalog = async (catalogUrl: string = 'https://uukanshu.cc/book/27548/') => {
    setCatalogLoading(true);
    try {
      const res = await fetch(`/api/catalog?url=${encodeURIComponent(catalogUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCatalog(data);
        }
      }
    } catch (err) {
      console.warn('Failed to load catalog:', err);
    } finally {
      setCatalogLoading(false);
    }
  };

  // Initial load on mount: restores the last remembered chapter
  useEffect(() => {
    const initialUrl = getStoredUrl();
    fetchChapter(initialUrl);
    loadCatalog('https://uukanshu.cc/book/27548/');
  }, []);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowLeft' && chapterData?.prevUrl) {
        fetchChapter(chapterData.prevUrl);
      } else if (e.key === 'ArrowRight' && chapterData?.nextUrl) {
        fetchChapter(chapterData.nextUrl);
      } else if ((e.key === 'd' || e.key === 'D') && chapterData) {
        const text = formatChapterToTxt(chapterData, formatOptions);
        downloadTxtFile(`${sanitizeFilename(chapterData.chapterTitle)}.txt`, text);
      } else if (e.key === 'b' || e.key === 'B') {
        setIsBatchOpen((prev) => !prev);
      } else if (e.key === 't' || e.key === 'T') {
        setIsCatalogOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chapterData, formatOptions, fetchChapter]);

  // Get Theme Background & Text Classes
  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-[#18181b] text-[#f4f4f5] dark';
      case 'black':
        return 'bg-[#09090b] text-[#e4e4e7] dark';
      case 'green':
        return 'bg-[#edf5ed] text-[#1c3821]';
      case 'light':
        return 'bg-[#ffffff] text-[#1f2937]';
      case 'parchment':
      default:
        return 'bg-[#fcf8f0] text-[#2d2a26]';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${getThemeClasses()}`}>
      {/* Top Navbar */}
      <Navbar
        bookTitle={chapterData?.bookTitle || catalog?.bookTitle}
        chapterTitle={chapterData?.chapterTitle}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenCatalog={() => setIsCatalogOpen(true)}
        onOpenBatch={() => setIsBatchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={theme}
        setTheme={setTheme}
        catalogCount={catalog?.totalChapters}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* URL Input & Navigation Bar */}
        <UrlBar
          url={currentUrl}
          setUrl={setCurrentUrl}
          onFetch={(target) => fetchChapter(target || currentUrl)}
          loading={loading}
          chapterData={chapterData}
          onNavigate={(target) => fetchChapter(target)}
        />

        {/* Loading Spinner Indicator */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-500 dark:text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            <p className="text-sm font-medium">Fetching and converting chapter from UU Novel...</p>
            <span className="text-xs text-stone-400 dark:text-zinc-500 font-mono">
              {currentUrl}
            </span>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex flex-col items-center text-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="text-base font-semibold text-red-900 dark:text-red-200">
                Failed to Read Chapter
              </h3>
              <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mt-1 max-w-md">
                {error}
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => fetchChapter(currentUrl)}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
              <button
                onClick={() => {
                  setCurrentUrl(INITIAL_TARGET_URL);
                  fetchChapter(INITIAL_TARGET_URL);
                }}
                className="px-4 py-2 bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border border-stone-300 dark:border-zinc-700 rounded-xl text-xs font-medium hover:bg-stone-100 transition cursor-pointer"
              >
                Reset to Target (Chapter 41)
              </button>
            </div>
          </div>
        )}

        {/* Content Presentation: TXT Preview or Reader View */}
        {!loading && !error && chapterData && (
          <div className="animate-in fade-in duration-200">
            {viewMode === 'txt' ? (
              <TxtPreview
                chapter={chapterData}
                formatOptions={formatOptions}
                setFormatOptions={setFormatOptions}
                onNavigate={(target) => fetchChapter(target)}
                loading={loading}
              />
            ) : (
              <ReaderView
                chapter={chapterData}
                settings={readerSettings}
                setSettings={setReaderSettings}
                onNavigate={(target) => fetchChapter(target)}
                formatOptions={formatOptions}
              />
            )}
          </div>
        )}

        {/* Empty / Initial State (if neither loaded nor error) */}
        {!loading && !error && !chapterData && (
          <div className="py-16 text-center text-stone-400 dark:text-zinc-500">
            Please enter a UU novel chapter URL and click Read Chapter.
          </div>
        )}
      </main>

      {/* Catalog TOC Modal */}
      <CatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        catalog={catalog}
        loading={catalogLoading}
        currentUrl={currentUrl}
        onSelectChapter={(url) => fetchChapter(url)}
      />

      {/* Batch Crawler & Exporter Modal */}
      <BatchModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        catalog={catalog}
        currentUrl={currentUrl}
        formatOptions={formatOptions}
        onSelectChapter={(url) => fetchChapter(url)}
      />

      {/* Format & Typography Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        formatOptions={formatOptions}
        setFormatOptions={setFormatOptions}
        readerSettings={readerSettings}
        setReaderSettings={setReaderSettings}
      />
    </div>
  );
}
