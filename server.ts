import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to normalize relative or absolute uukanshu URLs
function normalizeUrl(inputUrl: string, baseUrl = 'https://uukanshu.cc'): string {
  let url = inputUrl.trim();
  if (url.startsWith('//')) {
    url = 'https:' + url;
  } else if (url.startsWith('/')) {
    url = baseUrl.replace(/\/+$/, '') + url;
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

// Fetch helper with Cloudflare bypass (primary: Jina reader, fallback: direct/proxy)
async function fetchHtml(targetUrl: string): Promise<string> {
  const normalized = normalizeUrl(targetUrl);
  
  // Try Jina reader with HTML format
  try {
    const jinaUrl = `https://r.jina.ai/${normalized}`;
    const res = await fetch(jinaUrl, {
      headers: {
        'X-Return-Format': 'html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const html = await res.text();
      if (html && html.length > 500) {
        return html;
      }
    }
  } catch (err: any) {
    console.warn(`Jina fetch failed for ${normalized}:`, err.message);
  }

  // Fallback 1: Direct fetch with browser headers
  try {
    const res = await fetch(normalized, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      // Detect GBK or UTF-8
      const contentType = res.headers.get('content-type') || '';
      let encoding = 'utf-8';
      if (/charset=gbk|charset=gb2312/i.test(contentType)) {
        encoding = 'gbk';
      }
      return iconv.decode(Buffer.from(buffer), encoding);
    }
  } catch (err: any) {
    console.warn(`Direct fetch failed for ${normalized}:`, err.message);
  }

  // Fallback 2: Jina plain text / markdown fallback
  try {
    const jinaUrl = `https://r.jina.ai/${normalized}`;
    const res = await fetch(jinaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      return await res.text();
    }
  } catch (err: any) {
    console.warn(`Jina markdown fallback failed for ${normalized}:`, err.message);
  }

  throw new Error(`Unable to fetch content from ${normalized}. The site may be experiencing downtime or strict rate limiting.`);
}

// Extract chapter details and clean paragraph text
function parseChapterHtml(html: string, currentUrl: string) {
  const $ = cheerio.load(html);

  // Extract Book Title
  let bookTitle = '';
  // Try lastread script
  const scriptText = $('script').text();
  const lastreadMatch = scriptText.match(/lastread\.set\([^,]+,\s*[^,]+,\s*["']([^"']+)["']/);
  if (lastreadMatch && lastreadMatch[1]) {
    bookTitle = lastreadMatch[1].trim();
  }
  if (!bookTitle) {
    // Try breadcrumbs or page title
    const breadcrumbs = $('.path a, .breadcrumb a, .mbx a')
      .map((_, el) => $(el).text().trim())
      .get();
    if (breadcrumbs.length >= 2) {
      bookTitle = breadcrumbs[breadcrumbs.length - 1] || breadcrumbs[1];
    }
  }
  if (!bookTitle) {
    const metaTitle = $('title').text();
    const parts = metaTitle.split(/[-_|_]/);
    if (parts.length > 1) {
      bookTitle = parts[parts.length - 1].replace(/UU看書.*/, '').trim();
    }
  }
  if (!bookTitle) {
    bookTitle = 'UU看書小說';
  }

  // Extract Chapter Title
  let chapterTitle = $('h1').first().text().trim();
  if (!chapterTitle) {
    chapterTitle = $('.readtitle, #readtitle, .title').first().text().trim();
  }
  if (!chapterTitle) {
    const titleTag = $('title').text();
    const parts = titleTag.split(/[-_|_]/);
    chapterTitle = parts[0]?.trim() || '章節內容';
  }

  // Clean chapter title
  chapterTitle = chapterTitle.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');

function hasEndingPunctuation(text: string): boolean {
  if (!text) return false;
  const stripped = text.trim().replace(/['"”’」』）\)]+$/, '').trim();
  if (!stripped) return false;
  return /[。！？!?.…~～]|(\.{2,})$/.test(stripped);
}

function addEndingPunctuation(text: string, punct: string = '。'): string {
  if (!text) return text;
  const trimmed = text.trim();
  if (!trimmed || hasEndingPunctuation(trimmed)) return trimmed;
  if (/['"”’」』]$/.test(trimmed)) {
    const lastChar = trimmed.slice(-1);
    const body = trimmed.slice(0, -1);
    return `${body}${punct}${lastChar}`;
  }
  return `${trimmed}${punct}`;
}

  // Separate Chapter Number and Name (e.g., "第四十一章 黑暗賣藥界" -> "第四十一章", "黑暗賣藥界")
  let chapterNo = '';
  let chapterName = chapterTitle;
  const match = chapterTitle.match(/^(第[0-9一二三四五六七八九十百千万]+[章回卷節节])\s*(.*)$/);
  if (match) {
    chapterNo = match[1].trim();
    chapterName = match[2]?.trim() || '';
  }

  // If Chapter Name does not have statement-ending punctuation (such as dot or exclamation), add one
  const punctuatedChapterName = chapterName ? addEndingPunctuation(chapterName, '。') : '';
  const punctuatedChapterTitle = chapterNo && punctuatedChapterName
    ? `${chapterNo} ${punctuatedChapterName}`
    : addEndingPunctuation(chapterTitle, '。');

  // Clean content
  // Target container: .readcotent (uukanshu typo) or #content or #read
  let contentEl = $('.readcotent').length ? $('.readcotent') :
                  $('#content').length ? $('#content') :
                  $('#read').length ? $('#read') :
                  $('.read-content').length ? $('.read-content') :
                  $('article').length ? $('article') : null;

  const paragraphs: string[] = [];

  if (contentEl && contentEl.length > 0) {
    // Remove unwanted elements
    contentEl.find('script, style, ins, iframe, .ad, .advertisement, noscript, .read-nav').remove();

    // Get raw HTML inside content container
    let innerHtml = contentEl.html() || '';

    // Replace <br>, <p>, <div> tags with custom newline markers
    innerHtml = innerHtml
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/div>/gi, '\n')
      .replace(/<div[^>]*>/gi, '');

    // Load into cheerio to strip remaining html tags and decode entities
    const rawText = cheerio.load(`<div>${innerHtml}</div>`).text();

    const rawLines = rawText.split('\n');
    for (let line of rawLines) {
      // Clean full-width & standard whitespace
      line = line.replace(/^[ \t\u00A0\u3000\u2003\u2002]+|[ \t\u00A0\u3000\u2003\u2002]+$/g, '');
      
      // Filter out watermarks / ads / navigation lines
      if (!line) continue;
      if (/uukanshu\.cc|UU看書|請記住本書首發域名|最新章節請訪問|天才一秒記住/i.test(line)) continue;
      if (/^(加入書籤|上一章|下一章|章節目錄|目錄|推薦本書)$/.test(line)) continue;

      paragraphs.push(line);
    }
  } else {
    // Fallback: Check if this was Jina markdown text
    const mdLines = html.split('\n');
    let readingContent = false;
    for (let line of mdLines) {
      line = line.trim();
      if (line.startsWith('Markdown Content:')) {
        readingContent = true;
        const remainder = line.replace('Markdown Content:', '').trim();
        if (remainder) paragraphs.push(remainder);
        continue;
      }
      if (readingContent) {
        if (!line) continue;
        if (/^Title:|^URL Source:|^http/i.test(line)) continue;
        if (/uukanshu\.cc|UU看書|請記住本書首發/i.test(line)) continue;
        paragraphs.push(line);
      }
    }
  }

  // Extract Navigation Links
  const baseUrlObj = new URL(normalizeUrl(currentUrl));
  const baseUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}`;

  const prevLink = $('#linkPrev, a:contains("上一章")').first().attr('href') || null;
  const nextLink = $('#linkNext, a:contains("下一章")').first().attr('href') || null;
  const indexLink = $('#linkIndex, a:contains("章節目錄"), a:contains("目錄")').first().attr('href') || null;

  const prevUrl = prevLink ? normalizeUrl(prevLink, baseUrl) : null;
  const nextUrl = nextLink ? normalizeUrl(nextLink, baseUrl) : null;
  const catalogUrl = indexLink ? normalizeUrl(indexLink, baseUrl) : null;

  // Format the TXT output with Chapter no. and title at beginning, preserving newlines
  const header = punctuatedChapterTitle;
  const bodyText = paragraphs.join('\n\n');
  const formattedTxt = `${header}\n\n${bodyText}`;
  const totalChars = paragraphs.reduce((sum, p) => sum + p.length, 0);

  return {
    url: currentUrl,
    bookTitle,
    chapterTitle: punctuatedChapterTitle,
    chapterNo,
    chapterName: punctuatedChapterName,
    paragraphs,
    formattedTxt,
    charCount: totalChars,
    paragraphCount: paragraphs.length,
    prevUrl: prevUrl !== currentUrl ? prevUrl : null,
    nextUrl: nextUrl !== currentUrl ? nextUrl : null,
    catalogUrl,
  };
}

// Parse catalog TOC
function parseCatalogHtml(html: string, catalogUrl: string) {
  const $ = cheerio.load(html);
  const baseUrlObj = new URL(normalizeUrl(catalogUrl));
  const baseUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}`;

  let bookTitle = $('h1').first().text().trim() ||
                  $('.book-info h1, .booktitle, title').first().text().replace(/最新章節.*|UU看書.*/, '').trim() ||
                  'UU看書小說';

  // Extract author if available
  const author = $('.book-info .author, .author, span:contains("作者")').first().text().replace('作者：', '').trim() || '';

  const chapterMap = new Map<string, { title: string; url: string; chapterNo: string }>();

  // UUkan catalog links: only match numeric chapter html paths like /book/27548/17878396.html
  $('a').each((_, el) => {
    const href = $(el).attr('href') || '';
    const title = $(el).text().trim();
    if (/\/book\/\d+\/\d+\.html$/i.test(href) && title) {
      const fullUrl = normalizeUrl(href, baseUrl);
      const cleanTitle = title.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
      if (!chapterMap.has(fullUrl)) {
        const noMatch = cleanTitle.match(/^(第[0-9一二三四五六七八九十百千万]+[章回卷節节])/);
        chapterMap.set(fullUrl, {
          title: cleanTitle,
          url: fullUrl,
          chapterNo: noMatch ? noMatch[1] : '',
        });
      }
    }
  });

  const chapters = Array.from(chapterMap.values());

  // Note: on uukanshu catalog, sometimes the very first entry is the latest updated chapter preview box
  // if chapter 1 is after chapter 225, detect and organize properly
  let orderedChapters = [...chapters];
  if (orderedChapters.length > 2) {
    const firstTitle = orderedChapters[0].title;
    const secondTitle = orderedChapters[1].title;
    if ((firstTitle.includes('第二百') || firstTitle.includes('第百') || firstTitle.includes('第十')) &&
        (secondTitle.includes('第一章') || secondTitle.includes('第1章') || secondTitle.includes('第01章'))) {
      // First one is latest chapter preview, slice it off so list starts from chapter 1
      orderedChapters = orderedChapters.slice(1);
    }
  }

  return {
    bookTitle,
    author,
    catalogUrl,
    totalChapters: orderedChapters.length,
    chapters: orderedChapters,
  };
}

// In-memory cache for speed
const chapterCache = new Map<string, any>();
const catalogCache = new Map<string, any>();

// API Route: Get single chapter details
app.get('/api/chapter', async (req, res) => {
  const urlParam = req.query.url as string;
  if (!urlParam) {
    return res.status(400).json({ error: 'Missing "url" query parameter.' });
  }

  const normalized = normalizeUrl(urlParam);

  if (chapterCache.has(normalized)) {
    return res.json({ success: true, ...chapterCache.get(normalized), cached: true });
  }

  try {
    const html = await fetchHtml(normalized);
    const parsed = parseChapterHtml(html, normalized);
    chapterCache.set(normalized, parsed);
    return res.json({ success: true, ...parsed, cached: false });
  } catch (error: any) {
    console.error('Error fetching chapter:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch and parse chapter.',
    });
  }
});

// API Route: Get book catalog
app.get('/api/catalog', async (req, res) => {
  const urlParam = (req.query.url as string) || 'https://uukanshu.cc/book/27548/';
  const normalized = normalizeUrl(urlParam);

  if (catalogCache.has(normalized)) {
    return res.json({ success: true, ...catalogCache.get(normalized), cached: true });
  }

  try {
    const html = await fetchHtml(normalized);
    const parsed = parseCatalogHtml(html, normalized);
    catalogCache.set(normalized, parsed);
    return res.json({ success: true, ...parsed, cached: false });
  } catch (error: any) {
    console.error('Error fetching catalog:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch and parse catalog.',
    });
  }
});

// Production and Vite Dev middleware
async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
