import React from 'react';
import { X, Sliders, Type, AlignLeft, BookOpen, Check } from 'lucide-react';
import { FormatOptions, ReaderSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formatOptions: FormatOptions;
  setFormatOptions: React.Dispatch<React.SetStateAction<FormatOptions>>;
  readerSettings: ReaderSettings;
  setReaderSettings: React.Dispatch<React.SetStateAction<ReaderSettings>>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  formatOptions,
  setFormatOptions,
  readerSettings,
  setReaderSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-stone-50 dark:bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-zinc-100">
                TXT Formatting & Reader Settings
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Customize chapter titles, newline structure, and paragraph indentation
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

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh] text-xs sm:text-sm text-stone-700 dark:text-zinc-300">
          {/* Header Format Section */}
          <div className="space-y-2">
            <label className="font-semibold text-stone-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Chapter Header Format</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'standard', label: 'Standard', example: 'Chapter 41 ...' },
                { id: 'bracketed', label: 'Bracketed', example: '【Chapter 41 ...】' },
                { id: 'prefixed', label: 'Colon Separated', example: 'Chapter 41: ...' },
                { id: 'markdown', label: 'Markdown Header', example: '# Chapter 41 ...' },
                { id: 'decorative', label: 'Decorative Divider', example: '=== Chapter 41 ===' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() =>
                    setFormatOptions((prev) => ({
                      ...prev,
                      headerFormat: opt.id as any,
                    }))
                  }
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition cursor-pointer ${
                    formatOptions.headerFormat === opt.id
                      ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 ring-1 ring-amber-500'
                      : 'border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs">{opt.label}</span>
                    {formatOptions.headerFormat === opt.id && (
                      <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-stone-500 dark:text-zinc-400 truncate">
                    {opt.example}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Indent & Line Break Section */}
          <div className="space-y-3 pt-3 border-t border-stone-200/80 dark:border-zinc-800">
            <label className="font-semibold text-stone-900 dark:text-zinc-100 flex items-center gap-1.5">
              <AlignLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Indentation & Paragraph Spacing</span>
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200 dark:border-zinc-800">
                <div>
                  <div className="font-medium">Keep blank line between paragraphs (\n\n)</div>
                  <div className="text-xs text-stone-500 dark:text-zinc-400">
                    Inserts an empty line between paragraphs for clean e-reader parsing
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formatOptions.doubleNewline}
                  onChange={(e) =>
                    setFormatOptions((prev) => ({
                      ...prev,
                      doubleNewline: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200 dark:border-zinc-800">
                <div>
                  <div className="font-medium">Include book title above header</div>
                  <div className="text-xs text-stone-500 dark:text-zinc-400">
                    Automatically prefixes 《Book Title》 before each chapter title
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formatOptions.includeBookTitle}
                  onChange={(e) =>
                    setFormatOptions((prev) => ({
                      ...prev,
                      includeBookTitle: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {/* End Punctuation Setting */}
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Add statement-ending punctuation</div>
                    <div className="text-xs text-stone-500 dark:text-zinc-400">
                      If chapter name lacks punctuation (dot, exclamation, etc.), append one
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formatOptions.ensureEndingPunctuation}
                    onChange={(e) =>
                      setFormatOptions((prev) => ({
                        ...prev,
                        ensureEndingPunctuation: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </div>

                {formatOptions.ensureEndingPunctuation && (
                  <div className="pt-2 border-t border-stone-200/60 dark:border-zinc-700/60 flex items-center justify-between text-xs">
                    <span className="text-stone-600 dark:text-zinc-400">Punctuation mark to append:</span>
                    <select
                      value={formatOptions.endingPunctuationChar}
                      onChange={(e) =>
                        setFormatOptions((prev) => ({
                          ...prev,
                          endingPunctuationChar: e.target.value,
                        }))
                      }
                      className="bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-md px-2 py-1 text-xs text-stone-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 cursor-pointer font-mono"
                    >
                      <option value="。">Dot / Full stop (。)</option>
                      <option value="！">Exclamation mark (！)</option>
                      <option value=".">ASCII Period (.)</option>
                      <option value="!">ASCII Exclamation (!)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reader Display Settings */}
          <div className="space-y-3 pt-3 border-t border-stone-200/80 dark:border-zinc-800">
            <label className="font-semibold text-stone-900 dark:text-zinc-100 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Reader Typography & Line Height</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'serif', label: 'Serif (Ming/Song)' },
                { id: 'sans', label: 'Sans-Serif' },
                { id: 'kaiti', label: 'KaiTi' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() =>
                    setReaderSettings((prev) => ({
                      ...prev,
                      fontFamily: f.id as any,
                    }))
                  }
                  className={`py-2 px-3 rounded-xl border text-center text-xs font-medium transition cursor-pointer ${
                    readerSettings.fontFamily === f.id
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                      : 'border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-stone-500 dark:text-zinc-400">Line Height:</span>
              <div className="flex items-center gap-2">
                {[1.6, 1.8, 2.0, 2.2].map((lh) => (
                  <button
                    key={lh}
                    onClick={() =>
                      setReaderSettings((prev) => ({ ...prev, lineHeight: lh }))
                    }
                    className={`px-2 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                      readerSettings.lineHeight === lh
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300'
                    }`}
                  >
                    {lh}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
