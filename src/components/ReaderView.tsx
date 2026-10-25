import React from 'react';
import { ArrowLeft, ArrowRight, Minus, Plus, Download } from 'lucide-react';
import { ChapterData, FormatOptions, ReaderSettings } from '../types';
import { downloadTxtFile, formatChapterToTxt, sanitizeFilename, getFormattedChapterTitle } from '../utils/formatter';

interface ReaderViewProps {
  chapter: ChapterData;
  settings: ReaderSettings;
  setSettings: React.Dispatch<React.SetStateAction<ReaderSettings>>;
  onNavigate: (url: string) => void;
  formatOptions: FormatOptions;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  chapter,
  settings,
  setSettings,
  onNavigate,
  formatOptions,
}) => {
  const handleDownload = () => {
    const text = formatChapterToTxt(chapter, formatOptions);
    const filename = `${sanitizeFilename(chapter.chapterTitle || 'chapter')}.txt`;
    downloadTxtFile(filename, text);
  };

  const getFontFamilyClass = () => {
    switch (settings.fontFamily) {
      case 'serif':
        return 'font-serif';
      case 'kaiti':
        return 'font-serif italic';
      case 'sans':
      default:
        return 'font-sans';
    }
  };

  const getMaxWidthClass = () => {
    switch (settings.maxWidth) {
      case 'narrow':
        return 'max-w-2xl';
      case 'wide':
        return 'max-w-4xl';
      case 'medium':
      default:
        return 'max-w-3xl';
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Floating Reader Controls */}
      <div className="w-full max-w-3xl mb-4 p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-stone-200/80 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 shadow-xs text-xs">
        <div className="flex items-center gap-1">
          <span className="text-stone-500 dark:text-zinc-400 mr-1 text-[11px]">Font Size:</span>
          <button
            onClick={() => setSettings((s) => ({ ...s, fontSize: Math.max(14, s.fontSize - 1) }))}
            className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 flex items-center justify-center transition cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-9 text-center font-mono font-medium">{settings.fontSize}px</span>
          <button
            onClick={() => setSettings((s) => ({ ...s, fontSize: Math.min(30, s.fontSize + 1) }))}
            className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 flex items-center justify-center transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-stone-500 dark:text-zinc-400 text-[11px]">Width:</span>
          {(['narrow', 'medium', 'wide'] as const).map((w) => (
            <button
              key={w}
              onClick={() => setSettings((s) => ({ ...s, maxWidth: w }))}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                settings.maxWidth === w
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                  : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800'
              }`}
            >
              {w === 'narrow' ? 'Compact' : w === 'medium' ? 'Standard' : 'Wide'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-xs shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save TXT</span>
          </button>
        </div>
      </div>

      {/* Reader Paper Article */}
      <article
        className={`w-full ${getMaxWidthClass()} p-6 sm:p-12 rounded-2xl bg-white/95 dark:bg-zinc-900/90 border border-stone-200/90 dark:border-zinc-800/90 shadow-sm transition-all`}
        style={{
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
        }}
      >
        {/* Book Title & Chapter Header */}
        <header className="mb-8 pb-6 border-b border-stone-200/80 dark:border-zinc-800 text-center">
          {chapter.bookTitle && (
            <div className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-400 mb-2 tracking-widest uppercase">
              《{chapter.bookTitle}》
            </div>
          )}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight">
            {getFormattedChapterTitle(chapter, formatOptions)}
          </h1>
          <div className="mt-3 flex items-center justify-center gap-3 text-xs text-stone-500 dark:text-zinc-400">
            <span>{chapter.paragraphs.length} paragraphs</span>
            <span>•</span>
            <span>{chapter.charCount.toLocaleString()} characters</span>
          </div>
        </header>

        {/* Novel Paragraphs */}
        <div className={`space-y-4 text-stone-800 dark:text-zinc-200 ${getFontFamilyClass()}`}>
          {chapter.paragraphs.map((p, idx) => (
            <p
              key={idx}
              className="text-justify indent-8 sm:indent-9 tracking-wide"
            >
              {p}
            </p>
          ))}
        </div>

        {/* Bottom Chapter Navigation in Reader */}
        <footer className="mt-12 pt-8 border-t border-stone-200/80 dark:border-zinc-800 flex items-center justify-between gap-3">
          <button
            disabled={!chapter.prevUrl}
            onClick={() => chapter.prevUrl && onNavigate(chapter.prevUrl)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Chapter</span>
          </button>

          <span className="text-xs text-stone-400 dark:text-zinc-500 font-medium">
            {chapter.chapterNo || 'End of Chapter'}
          </span>

          <button
            disabled={!chapter.nextUrl}
            onClick={() => chapter.nextUrl && onNavigate(chapter.nextUrl)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition cursor-pointer"
          >
            <span>Next Chapter</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </footer>
      </article>
    </div>
  );
};
