import React from 'react';
import { BookOpen, FileText, List, Layers, Settings, BookMarked } from 'lucide-react';
import { ThemeMode } from '../types';

interface NavbarProps {
  bookTitle?: string;
  chapterTitle?: string;
  viewMode: 'txt' | 'reader';
  setViewMode: (mode: 'txt' | 'reader') => void;
  onOpenCatalog: () => void;
  onOpenBatch: () => void;
  onOpenSettings: () => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  catalogCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  bookTitle,
  chapterTitle,
  viewMode,
  setViewMode,
  onOpenCatalog,
  onOpenBatch,
  onOpenSettings,
  theme,
  setTheme,
  catalogCount,
}) => {
  const themes: { id: ThemeMode; label: string; iconBg: string }[] = [
    { id: 'parchment', label: 'Parchment', iconBg: 'bg-[#f4ebd0]' },
    { id: 'green', label: 'Eye Care Green', iconBg: 'bg-[#e2ede2]' },
    { id: 'light', label: 'Ivory White', iconBg: 'bg-white' },
    { id: 'dark', label: 'Dark Charcoal', iconBg: 'bg-[#27272a]' },
    { id: 'black', label: 'OLED Night', iconBg: 'bg-[#09090b]' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 dark:border-zinc-800/80 backdrop-blur-md bg-stone-50/90 dark:bg-zinc-900/90 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left Branding */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-600 dark:bg-amber-500 flex items-center justify-center text-white shadow-sm shadow-amber-600/20 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900 dark:text-zinc-100 text-sm sm:text-base truncate tracking-tight">
                UU Novel TXT Converter
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                uukanshu.cc
              </span>
            </div>
            {bookTitle && (
              <div className="text-xs text-stone-500 dark:text-zinc-400 truncate flex items-center gap-1.5">
                <span className="font-medium text-stone-700 dark:text-zinc-300">{bookTitle}</span>
                {chapterTitle && (
                  <>
                    <span className="opacity-40">•</span>
                    <span className="truncate opacity-90">{chapterTitle}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Middle Mode Switcher */}
        <div className="hidden md:flex items-center p-1 rounded-xl bg-stone-200/70 dark:bg-zinc-800/80 border border-stone-300/50 dark:border-zinc-700/50">
          <button
            onClick={() => setViewMode('txt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'txt'
                ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>TXT Preview</span>
          </button>
          <button
            onClick={() => setViewMode('reader')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'reader'
                ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>Reader View</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Catalog TOC Button */}
          <button
            onClick={onOpenCatalog}
            title="Browse Chapters / Table of Contents (T)"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 border border-stone-300/60 dark:border-zinc-700 transition cursor-pointer"
          >
            <List className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">TOC</span>
            {catalogCount ? (
              <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500/15 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300 rounded text-[11px] font-semibold">
                {catalogCount}
              </span>
            ) : null}
          </button>

          {/* Batch Reader / Exporter Button */}
          <button
            onClick={onOpenBatch}
            title="Batch Read & Export (B)"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Batch Export</span>
          </button>

          {/* Theme Quick Selector */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={t.label}
                className={`w-6 h-6 rounded-md border transition-transform cursor-pointer ${t.iconBg} ${
                  theme === t.id
                    ? 'scale-110 ring-2 ring-amber-500 border-amber-500 shadow-xs'
                    : 'border-stone-300 dark:border-zinc-600 opacity-75 hover:opacity-100'
                }`}
              />
            ))}
          </div>

          {/* Format Settings Modal Trigger */}
          <button
            onClick={onOpenSettings}
            title="Formatting & Reader Settings"
            className="p-2 rounded-lg text-stone-600 dark:text-zinc-300 hover:bg-stone-200/80 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
