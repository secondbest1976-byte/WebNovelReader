import React, { useState } from 'react';
import { RotateCcw, Search, Loader2, Link2, Bookmark } from 'lucide-react';
import { ChapterData } from '../types';

interface UrlBarProps {
  url: string;
  setUrl: (url: string) => void;
  onFetch: (targetUrl?: string) => void;
  loading: boolean;
  chapterData: ChapterData | null;
  onNavigate?: (targetUrl: string) => void;
}

const DEFAULT_TARGET_URL = 'https://uukanshu.cc/book/27548/17878356.html';

export const UrlBar: React.FC<UrlBarProps> = ({
  url,
  setUrl,
  onFetch,
  loading,
  chapterData,
}) => {
  const [localUrl, setLocalUrl] = useState(url);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localUrl.trim()) return;
    setUrl(localUrl.trim());
    onFetch(localUrl.trim());
  };

  const handleResetTarget = () => {
    setLocalUrl(DEFAULT_TARGET_URL);
    setUrl(DEFAULT_TARGET_URL);
    onFetch(DEFAULT_TARGET_URL);
  };

  React.useEffect(() => {
    setLocalUrl(url);
  }, [url]);

  return (
    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-stone-200/90 dark:border-zinc-800/90 p-3 sm:p-4 shadow-sm transition-all">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 items-stretch">
        {/* URL Input */}
        <div className="relative flex-1 flex items-center">
          <div className="absolute left-3.5 text-stone-400 dark:text-zinc-500 pointer-events-none flex items-center gap-1.5">
            <Link2 className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={localUrl}
            onChange={(e) => setLocalUrl(e.target.value)}
            placeholder="Enter chapter URL (e.g., https://uukanshu.cc/book/27548/17878396.html)"
            className="w-full pl-10 pr-32 py-2.5 text-xs sm:text-sm font-mono bg-stone-50 dark:bg-zinc-800/90 border border-stone-300/80 dark:border-zinc-700 rounded-xl text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
          />

          {localUrl !== DEFAULT_TARGET_URL && (
            <button
              type="button"
              onClick={handleResetTarget}
              title="Reset to default initial chapter (Chapter 1)"
              className="absolute right-2 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60 rounded-md transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Chapter 1</span>
            </button>
          )}
        </div>

        {/* Read Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium rounded-xl text-xs sm:text-sm shadow-xs transition cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Reading & Parsing...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Read Chapter</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Chapter Metadata Ribbon */}
      {chapterData && (
        <div className="mt-3 pt-3 border-t border-stone-200/60 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600 dark:text-zinc-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-stone-800 dark:text-zinc-200">
              {chapterData.chapterTitle}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 font-mono text-[11px]">
              {chapterData.paragraphCount} paragraphs
            </span>
            <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 font-mono text-[11px]">
              ~{chapterData.charCount.toLocaleString()} chars
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium text-[10px] flex items-center gap-1">
              <Bookmark className="w-3 h-3 fill-current" />
              <span>Saved position</span>
            </span>
            {chapterData.cached && (
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium text-[10px]">
                Cached
              </span>
            )}
          </div>

          <div className="text-[11px] text-stone-400 dark:text-zinc-500 hidden sm:flex items-center gap-2">
            <span>Shortcuts: ← / → Navigate | C Copy | D Download TXT</span>
          </div>
        </div>
      )}
    </div>
  );
};
