import React, { useState, useMemo } from 'react';
import { X, Search, BookOpen, Loader2, Check, ArrowRight } from 'lucide-react';
import { CatalogData } from '../types';

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: CatalogData | null;
  loading: boolean;
  currentUrl: string;
  onSelectChapter: (url: string) => void;
}

export const CatalogModal: React.FC<CatalogModalProps> = ({
  isOpen,
  onClose,
  catalog,
  loading,
  currentUrl,
  onSelectChapter,
}) => {
  const [search, setSearch] = useState('');

  const filteredChapters = useMemo(() => {
    if (!catalog?.chapters) return [];
    if (!search.trim()) return catalog.chapters;
    const q = search.trim().toLowerCase();
    return catalog.chapters.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.chapterNo.toLowerCase().includes(q) ||
        c.url.toLowerCase().includes(q)
    );
  }, [catalog, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-stone-50 dark:bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-zinc-100">
                {catalog?.bookTitle || 'Novel Chapters'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                {catalog?.totalChapters || 0} chapters available
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-stone-200/70 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-3 border-b border-stone-200 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-950/50">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-stone-400 dark:text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chapter title or number (e.g., 41, Medicine, Chapter 1)..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 rounded-xl text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Chapter List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-stone-100 dark:divide-zinc-800/60">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-stone-500 dark:text-zinc-400 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              <span className="text-sm">Loading full table of contents...</span>
            </div>
          ) : filteredChapters.length === 0 ? (
            <div className="py-12 text-center text-stone-400 dark:text-zinc-500 text-sm">
              No chapters found matching "{search}"
            </div>
          ) : (
            filteredChapters.map((item, index) => {
              const isCurrent = currentUrl === item.url || currentUrl.endsWith(item.url);
              return (
                <button
                  key={item.url || index}
                  onClick={() => {
                    onSelectChapter(item.url);
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm transition group cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-semibold'
                      : 'hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-8 text-[11px] font-mono text-stone-400 dark:text-zinc-500">
                      #{index + 1}
                    </span>
                    <span className="truncate group-hover:text-amber-700 dark:group-hover:text-amber-400">
                      {item.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500 text-white font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-amber-600 transition" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
