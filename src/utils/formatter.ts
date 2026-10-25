import { ChapterData, FormatOptions } from '../types';

/**
 * Checks if a string already ends with a punctuation mark indicating
 * the end of a statement (such as full stop, exclamation mark, question mark, or ellipsis),
 * taking into account any trailing closing quotes or brackets.
 */
export function hasEndingPunctuation(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Strip trailing closing quotes or brackets to inspect the core ending character
  const stripped = trimmed.replace(/['"”’」』）\)]+$/, '').trim();
  if (!stripped) return false;

  // Regex for sentence-ending punctuation:
  // Ideographic full stop (。), full-width exclamation (！), full-width question mark (？),
  // ASCII period (.), ASCII exclamation (!), ASCII question mark (?),
  // Ellipsis (… or ...), and tildes (～, ~)
  return /[。！？!?.…~～]|(\.{2,})$/.test(stripped);
}

/**
 * Ensures the chapter name ends with a punctuation mark to show an end of statement.
 * If it already has ending punctuation (e.g. ! or ? or .), it is kept untouched.
 * Otherwise, the specified punctuation mark (default: '。') is appended.
 */
export function addEndingPunctuation(text: string, punct: string = '。'): string {
  if (!text) return text;
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  if (hasEndingPunctuation(trimmed)) {
    return trimmed;
  }

  // If the text ends with closing quotes or brackets, insert punctuation before the closing quote
  if (/['"”’」』]$/.test(trimmed)) {
    const lastChar = trimmed.slice(-1);
    const body = trimmed.slice(0, -1);
    return `${body}${punct}${lastChar}`;
  }

  return `${trimmed}${punct}`;
}

/**
 * Resolves the chapter title with punctuation applied to the chapter name
 * when ensureEndingPunctuation is enabled.
 */
export function getFormattedChapterTitle(
  chapter: ChapterData,
  options?: Partial<FormatOptions>
): string {
  const shouldPunctuate = options?.ensureEndingPunctuation !== false;
  const punct = options?.endingPunctuationChar || '。';

  const rawChapterNo = chapter.chapterNo?.trim() || '';
  const rawChapterName = chapter.chapterName?.trim() || '';
  const rawTitle = chapter.chapterTitle?.trim() || 'Chapter';

  if (shouldPunctuate) {
    if (rawChapterName) {
      const punctuatedName = addEndingPunctuation(rawChapterName, punct);
      return rawChapterNo ? `${rawChapterNo} ${punctuatedName}` : punctuatedName;
    }
    return addEndingPunctuation(rawTitle, punct);
  }

  return rawTitle;
}

export function formatChapterToTxt(chapter: ChapterData, options: FormatOptions): string {
  const {
    headerFormat,
    indentStyle,
    doubleNewline,
    includeBookTitle,
    ensureEndingPunctuation = true,
    endingPunctuationChar = '。',
  } = options;

  // 1. Build Header with Chapter No. and Title, applying punctuation rule
  const titleStr = getFormattedChapterTitle(chapter, {
    ensureEndingPunctuation,
    endingPunctuationChar,
  });

  const punctuatedChapterName = chapter.chapterName
    ? ensureEndingPunctuation
      ? addEndingPunctuation(chapter.chapterName, endingPunctuationChar)
      : chapter.chapterName
    : '';

  let formattedHeader = '';

  switch (headerFormat) {
    case 'bracketed':
      formattedHeader = `【${titleStr}】`;
      break;
    case 'markdown':
      formattedHeader = `# ${titleStr}`;
      break;
    case 'decorative':
      formattedHeader = `========================================\n${titleStr}\n========================================`;
      break;
    case 'prefixed':
      formattedHeader = chapter.chapterNo && punctuatedChapterName
        ? `${chapter.chapterNo}：${punctuatedChapterName}`
        : titleStr;
      break;
    case 'standard':
    default:
      formattedHeader = titleStr;
      break;
  }

  // Optional book title prefix if requested
  let fullHeader = formattedHeader;
  if (includeBookTitle && chapter.bookTitle) {
    fullHeader = `《${chapter.bookTitle}》\n${formattedHeader}`;
  }

  // 2. Format Paragraphs with Indent
  let indentStr = '';
  if (indentStyle === 'chinese') {
    indentStr = '　　'; // Full-width Chinese 2-space indent
  } else if (indentStyle === 'spaces') {
    indentStr = '    ';
  } else if (indentStyle === 'tab') {
    indentStr = '\t';
  }

  const formattedParagraphs = chapter.paragraphs.map((p) => {
    const clean = p.trim();
    return clean ? `${indentStr}${clean}` : '';
  }).filter(Boolean);

  // 3. Join with newlines (double newline is standard for clean novel TXT formatting)
  const paragraphJoiner = doubleNewline ? '\n\n' : '\n';
  const body = formattedParagraphs.join(paragraphJoiner);

  return `${fullHeader}\n\n${body}\n`;
}

// Download a plain text string as a .txt file
export function downloadTxtFile(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Sanitize filename for safe saving
export function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'chapter';
}
