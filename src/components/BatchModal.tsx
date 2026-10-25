import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Square,
  Download,
  Archive,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Layers,
} from 'lucide-react';
import JSZip from 'jszip';
import { CatalogData, ChapterData, FormatOptions } from '../types';
import { formatChapterToTxt, downloadTxtFile, sanitizeFilename } from '../utils/formatter';

interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: CatalogData | null;
  currentUrl: string;
  formatOptions: FormatOptions;
  onSelectChapter: (url: string) => void;
}

interface ChapterTask {
  index: number;
  url: string;
  title: string;
  chapterNo: string;
  status: 'pending' | 'fetching' | 'completed' | 'error';
  error?: string;
  data?: ChapterData;
}

export const BatchModal: React.FC<BatchModalProps> = ({
  isOpen,
  onClose,
  catalog,
  currentUrl,
  formatOptions,
  onSelectChapter,
}) => {
  const [tasks, setTasks] = useState<ChapterTask[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [delayMs, setDelayMs] = useState(400);
  const [countPreset, setCountPreset] = useState<number>(10);
  const [zipGenerating, setZipGenerating] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  // Initialize batch list based on current chapter URL
  useEffect(() => {
    if (!isOpen || !catalog?.chapters?.length) return;

    // Find current index
    const currentIndex = catalog.chapters.findIndex(
      (c) => c.url === currentUrl || currentUrl.endsWith(c.url)
    );
    const startIdx = currentIndex >= 0 ? currentIndex : 0;

    const slice = catalog.chapters.slice(startIdx, startIdx + countPreset);
    const initialTasks: ChapterTask[] = slice.map((item, idx) => ({
      index: startIdx + idx + 1,
      url: item.url,
      title: item.title,
      chapterNo: item.chapterNo,
      status: 'pending',
    }));

    setTasks(initialTasks);
    setIsRunning(false);
    setIsPaused(false);
  }, [isOpen, catalog, currentUrl, countPreset]);

  const handleSelectCount = (count: number) => {
    setCountPreset(count);
  };

  // Start Batch Fetching
  const startBatch = async () => {
    if (tasks.length === 0) return;
    setIsRunning(true);
    setIsPaused(false);
    abortControllerRef.current = new AbortController();

    for (let i = 0; i < tasks.length; i++) {
      if (!isRunningRef.current) break;

      while (isPausedRef.current && isRunningRef.current) {
        await new Promise((r) => setTimeout(r, 200));
      }

      if (!isRunningRef.current) break;

      const currentTask = tasks[i];
      if (currentTask.status === 'completed' && currentTask.data) {
        continue;
      }

      setTasks((prev) =>
        prev.map((t, idx) => (idx === i ? { ...t, status: 'fetching' } : t))
      );

      try {
        const res = await fetch(`/api/chapter?url=${encodeURIComponent(currentTask.url)}`, {
          signal: abortControllerRef.current.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Parsing failed');

        setTasks((prev) =>
          prev.map((t, idx) =>
            idx === i ? { ...t, status: 'completed', data: json } : t
          )
        );
      } catch (err: any) {
        if (err.name === 'AbortError') break;
        setTasks((prev) =>
          prev.map((t, idx) =>
            idx === i ? { ...t, status: 'error', error: err.message || 'Fetch failed' } : t
          )
        );
      }

      if (delayMs > 0 && i < tasks.length - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    setIsRunning(false);
  };

  const handlePauseResume = () => {
    setIsPaused((prev) => !prev);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Stats
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const totalCharacters = tasks.reduce(
    (sum, t) => sum + (t.data?.charCount || 0),
    0
  );

  // Download All as Combined Single TXT
  const handleDownloadCombinedTxt = () => {
    const completedTasks = tasks.filter((t) => t.status === 'completed' && t.data);
    if (completedTasks.length === 0) return;

    const bookTitle = catalog?.bookTitle || completedTasks[0].data?.bookTitle || 'Novel';
    const firstTitle = completedTasks[0].title;
    const lastTitle = completedTasks[completedTasks.length - 1].title;

    let combinedText = `《${bookTitle}》\nChapter Range: ${firstTitle} to ${lastTitle}\nTotal Chapters: ${completedTasks.length}\nTotal Characters: ~${totalCharacters.toLocaleString()}\nExport Time: ${new Date().toLocaleString()}\n\n`;
    combinedText += `==================================================\n\n`;

    completedTasks.forEach((t, i) => {
      if (t.data) {
        const chapterTxt = formatChapterToTxt(t.data, formatOptions);
        combinedText += chapterTxt;
        if (i < completedTasks.length - 1) {
          combinedText += `\n\n==================================================\n\n`;
        }
      }
    });

    const filename = `${sanitizeFilename(bookTitle)}_${sanitizeFilename(firstTitle)}-${sanitizeFilename(lastTitle)}.txt`;
    downloadTxtFile(filename, combinedText);
  };

  // Download All as ZIP Archive
  const handleDownloadZip = async () => {
    const completedTasks = tasks.filter((t) => t.status === 'completed' && t.data);
    if (completedTasks.length === 0) return;

    setZipGenerating(true);
    try {
      const zip = new JSZip();
      const bookTitle = catalog?.bookTitle || completedTasks[0].data?.bookTitle || 'UU_Novel';
      const folder = zip.folder(sanitizeFilename(bookTitle)) || zip;

      completedTasks.forEach((t) => {
        if (t.data) {
          const txt = formatChapterToTxt(t.data, formatOptions);
          const numPrefix = String(t.index).padStart(4, '0');
          const cleanName = sanitizeFilename(t.title || `Chapter_${t.index}`);
          folder.file(`${numPrefix}_${cleanName}.txt`, txt);
        }
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizeFilename(bookTitle)}_TXT_Collection_${completedTasks.length}_chapters.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP generation failed', err);
    } finally {
      setZipGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[88vh] bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-stone-50 dark:bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Batch Chapter Reader & TXT Exporter</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  Preserves Newlines • Header Included
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Sequentially reads chapters from current position and exports to consolidated TXT or a ZIP of individual TXTs.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              handleStop();
              onClose();
            }}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-stone-200/70 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="px-5 py-3 border-b border-stone-200 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-950/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Presets */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 dark:text-zinc-400 font-medium">Read Count:</span>
            {[5, 10, 25, 50].map((cnt) => (
              <button
                key={cnt}
                disabled={isRunning}
                onClick={() => handleSelectCount(cnt)}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  countPreset === cnt
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-700 disabled:opacity-50'
                }`}
              >
                Next {cnt} Chs
              </button>
            ))}
          </div>

          {/* Delay Slider */}
          <div className="flex items-center gap-2">
            <span className="text-stone-500 dark:text-zinc-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Delay:</span>
            </span>
            <input
              type="range"
              min="200"
              max="1500"
              step="100"
              value={delayMs}
              onChange={(e) => setDelayMs(parseInt(e.target.value, 10))}
              className="w-24 accent-amber-600 cursor-pointer"
            />
            <span className="w-12 font-mono text-stone-700 dark:text-zinc-300">
              {delayMs}ms
            </span>
          </div>
        </div>

        {/* Progress Card */}
        <div className="p-4 bg-stone-100/60 dark:bg-zinc-900/60 border-b border-stone-200 dark:border-zinc-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-stone-700 dark:text-zinc-300 font-medium">
            <div className="flex items-center gap-2">
              <span>Progress:</span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                {completedCount} / {tasks.length}
              </span>
              <span>({progressPercent}%)</span>
              {totalCharacters > 0 && (
                <span className="text-stone-400 dark:text-zinc-500">
                  • Total ~{totalCharacters.toLocaleString()} chars
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isRunning ? (
                <button
                  onClick={startBatch}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Batch Read</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePauseResume}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-stone-200 dark:bg-zinc-700 hover:bg-stone-300 dark:hover:bg-zinc-600 text-stone-800 dark:text-zinc-100 transition cursor-pointer"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60 transition cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-stone-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-600 dark:bg-amber-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {tasks.map((task) => (
            <div
              key={task.url}
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
                task.status === 'fetching'
                  ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100'
                  : task.status === 'completed'
                  ? 'border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/80 text-stone-800 dark:text-zinc-200'
                  : task.status === 'error'
                  ? 'border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 text-red-800 dark:text-red-300'
                  : 'border-stone-200/60 dark:border-zinc-800/60 bg-stone-50/40 dark:bg-zinc-900/40 text-stone-500 dark:text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-8 text-[11px] font-mono text-stone-400 dark:text-zinc-500">
                  #{task.index}
                </span>
                <span className="font-medium truncate">{task.title}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {task.status === 'fetching' && (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Reading</span>
                  </span>
                )}
                {task.status === 'completed' && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-stone-500 dark:text-zinc-400 font-mono">
                      ~{task.data?.charCount.toLocaleString()} chars
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <button
                      onClick={() => {
                        onSelectChapter(task.url);
                        onClose();
                      }}
                      title="View this chapter in reader"
                      className="px-1.5 py-0.5 rounded text-[10px] bg-stone-100 hover:bg-stone-200 dark:bg-zinc-700 text-stone-700 dark:text-zinc-200 cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                )}
                {task.status === 'error' && (
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{task.error || 'Failed'}</span>
                  </span>
                )}
                {task.status === 'pending' && (
                  <span className="text-[11px] text-stone-400 dark:text-zinc-600">Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-stone-500 dark:text-zinc-400">
            {completedCount > 0 ? (
              <span>Successfully processed {completedCount} chapter(s)</span>
            ) : (
              <span>Click "Start Batch Read" to process sequential chapters</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Download Combined TXT */}
            <button
              disabled={completedCount === 0}
              onClick={handleDownloadCombinedTxt}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed border border-stone-300/80 dark:border-zinc-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Export Combined .TXT</span>
            </button>

            {/* Download ZIP Archive */}
            <button
              disabled={completedCount === 0 || zipGenerating}
              onClick={handleDownloadZip}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition cursor-pointer"
            >
              {zipGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Packaging ZIP...</span>
                </>
              ) : (
                <>
                  <Archive className="w-3.5 h-3.5" />
                  <span>Download .ZIP (All TXTs)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
