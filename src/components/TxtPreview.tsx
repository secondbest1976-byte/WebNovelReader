import React, { useState } from 'react';
import { Download, Copy, Check, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { ChapterData, FormatOptions } from '../types';
import { formatChapterToTxt, downloadTxtFile, sanitizeFilename } from '../utils/formatter';

interface TxtPreviewProps {
  chapter: ChapterData;
  formatOptions: FormatOptions;
  setFormatOptions: React.Dispatch<React.SetStateAction<FormatOptions>>;
  onNavigate?: (url: string) => void;
  loading?: boolean;
}

export const TxtPreview: React.FC<TxtPreviewProps> = ({
  chapter,
  formatOptions,
  setFormatOptions,
  onNavigate,
  loading = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [fontStyle, setFontStyle] = useState<'mono' | 'sans' | 'serif'>('mono');

  const generatedTxt = formatChapterToTxt(chapter, formatOptions);
  const lineCount = generatedTxt.split('\n').length;
  const byteSize = new Blob([generatedTxt]).size;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedTxt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const filename = `${sanitizeFilename(chapter.chapterTitle || 'chapter')}.txt`;
    downloadTxtFile(filename, generatedTxt);
  };

  const totalCharacters = chapter.charCount || generatedTxt.length;
  const isOver5000 = totalCharacters >= 5000;

  return (
    <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl border border-stone-200/90 dark:border-zinc-800/90 shadow-sm overflow-hidden flex flex-col transition-all">
      {/* Action Header */}
      <div className="px-4 py-3.5 border-b border-stone-200/80 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 bg-stone-50/70 dark:bg-zinc-900/70">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
            TXT
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Chapter Plaintext Preview</span>
              <span className="text-[11px] font-normal text-stone-500 dark:text-zinc-400">
                ({lineCount} lines / {(byteSize / 1024).toFixed(1)} KB)
              </span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-zinc-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Includes Chapter No. and Title at beginning (with end punctuation) • Newlines preserved</span>
            </p>
          </div>
        </div>

        {/* Action Buttons: Prev, Next, Copy All, and Download .TXT in the same segment */}
        <div className="flex items-center gap-2">
          {/* Prev Chapter Button */}
          <button
            type="button"
            disabled={!chapter.prevUrl || loading}
            onClick={() => chapter.prevUrl && onNavigate?.(chapter.prevUrl)}
            title="Previous Chapter (Keyboard ←)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed border border-stone-300/70 dark:border-zinc-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          {/* Next Chapter Button */}
          <button
            type="button"
            disabled={!chapter.nextUrl || loading}
            onClick={() => chapter.nextUrl && onNavigate?.(chapter.nextUrl)}
            title="Next Chapter (Keyboard →)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed border border-stone-300/70 dark:border-zinc-700 transition cursor-pointer"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="h-5 w-px bg-stone-300 dark:bg-zinc-700 mx-0.5 hidden sm:block" />

          {/* Copy Button (Red background if >= 5000 characters, else standard color) */}
          <button
            onClick={handleCopy}
            title={
              isOver5000
                ? `Copy All (${totalCharacters.toLocaleString()} characters — 5000+ chars)`
                : 'Copy All (Keyboard C)'
            }
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
              isOver5000
                ? copied
                  ? 'bg-red-700 hover:bg-red-800 text-white border-red-800 shadow-xs'
                  : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border-red-700 shadow-xs'
                : copied
                ? 'bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 border-stone-300/70 dark:border-zinc-700'
                : 'bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 border-stone-300/70 dark:border-zinc-700'
            }`}
          >
            {copied ? (
              <>
                <Check
                  className={`w-4 h-4 ${
                    isOver5000 ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                />
                <span
                  className={
                    isOver5000
                      ? 'text-white font-semibold'
                      : 'text-emerald-700 dark:text-emerald-400 font-semibold'
                  }
                >
                  Copied!
                </span>
              </>
            ) : (
              <>
                <Copy
                  className={`w-4 h-4 ${
                    isOver5000 ? 'text-white' : 'text-stone-500 dark:text-zinc-400'
                  }`}
                />
                <span>Copy All</span>
              </>
            )}
          </button>

          {/* Download TXT Button */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download .TXT</span>
          </button>
        </div>
      </div>

      {/* Quick Formatting Toolbar */}
      <div className="px-4 py-2 border-b border-stone-100 dark:border-zinc-800/60 bg-stone-50/40 dark:bg-zinc-950/40 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Quick Format Options */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Header Format */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 dark:text-zinc-400 text-[11px]">Header Format:</span>
            <select
              value={formatOptions.headerFormat}
              onChange={(e) =>
                setFormatOptions((prev) => ({
                  ...prev,
                  headerFormat: e.target.value as any,
                }))
              }
              className="bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-md px-2 py-1 text-xs text-stone-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="standard">Standard (Chapter 41 ...)</option>
              <option value="bracketed">Bracketed (【Chapter 41 ...】)</option>
              <option value="markdown">Markdown Header (# Chapter 41 ...)</option>
              <option value="decorative">Decorative Divider (=== Chapter 41 ===)</option>
              <option value="prefixed">Colon Separated (Chapter 41: ...)</option>
            </select>
          </div>

          {/* Indent Style */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 dark:text-zinc-400 text-[11px]">Indent:</span>
            <select
              value={formatOptions.indentStyle}
              onChange={(e) =>
                setFormatOptions((prev) => ({
                  ...prev,
                  indentStyle: e.target.value as any,
                }))
              }
              className="bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-md px-2 py-1 text-xs text-stone-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="chinese">Chinese 2-space (　　)</option>
              <option value="none">Flush Left (None)</option>
              <option value="spaces">4 Spaces</option>
              <option value="tab">Tab Indent</option>
            </select>
          </div>

          {/* Ending Punctuation */}
          <div className="flex items-center gap-1.5">
            <label className="flex items-center gap-1 cursor-pointer text-stone-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={formatOptions.ensureEndingPunctuation}
                onChange={(e) =>
                  setFormatOptions((prev) => ({
                    ...prev,
                    ensureEndingPunctuation: e.target.checked,
                  }))
                }
                className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-[11px]">End Punctuation:</span>
            </label>
            {formatOptions.ensureEndingPunctuation && (
              <select
                value={formatOptions.endingPunctuationChar}
                onChange={(e) =>
                  setFormatOptions((prev) => ({
                    ...prev,
                    endingPunctuationChar: e.target.value,
                  }))
                }
                className="bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-md px-1.5 py-0.5 text-xs text-stone-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 cursor-pointer font-mono"
              >
                <option value="。">Dot / Full stop (。)</option>
                <option value="！">Exclamation (！)</option>
                <option value=".">Period (.)</option>
                <option value="!">Exclamation (!)</option>
              </select>
            )}
          </div>

          {/* Double newline toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer text-stone-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={formatOptions.doubleNewline}
              onChange={(e) =>
                setFormatOptions((prev) => ({
                  ...prev,
                  doubleNewline: e.target.checked,
                }))
              }
              className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <span className="text-[11px]">Double newline between paragraphs (\n\n)</span>
          </label>
        </div>

        {/* Right: Preview Font Selector */}
        <div className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-zinc-400">
          <span>Preview Font:</span>
          {(['mono', 'serif', 'sans'] as const).map((font) => (
            <button
              key={font}
              onClick={() => setFontStyle(font)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                fontStyle === font
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                  : 'hover:bg-stone-200/60 dark:hover:bg-zinc-800 text-stone-600 dark:text-zinc-400'
              }`}
            >
              {font === 'mono' ? 'Monospace' : font === 'serif' ? 'Serif' : 'Sans'}
            </button>
          ))}
        </div>
      </div>

      {/* Raw TXT Container with Clean Line Formatting */}
      <div className="relative p-4 sm:p-6 max-h-[70vh] overflow-y-auto selection:bg-amber-200 selection:text-amber-900 dark:selection:bg-amber-900/70 dark:selection:text-amber-100">
        <pre
          className={`whitespace-pre-wrap break-words leading-relaxed text-sm sm:text-base text-stone-800 dark:text-zinc-200 ${
            fontStyle === 'mono'
              ? 'font-mono'
              : fontStyle === 'serif'
              ? 'font-serif'
              : 'font-sans'
          }`}
        >
          {generatedTxt}
        </pre>
      </div>

      {/* Bottom Footer Info */}
      <div className="px-4 py-2.5 border-t border-stone-200/70 dark:border-zinc-800/70 bg-stone-50/50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between text-xs text-stone-500 dark:text-zinc-400">
        <div>
          File Name: <code className="text-stone-700 dark:text-zinc-300 font-mono">{sanitizeFilename(chapter.chapterTitle)}.txt</code>
        </div>
        <div className="flex items-center gap-4">
          <span>Line Ending: LF (\n)</span>
          <span>Encoding: UTF-8</span>
        </div>
      </div>
    </div>
  );
};
