export interface WordDocumentInspection {
  pageCount: number;
  pageHtmls: string[];
  isRtl: boolean;
  coverDataUrl: string;
}

const ARABIC_CHAR_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g;
const LATIN_CHAR_REGEX = /[A-Za-z]/g;

function detectIsRtl(text: string): boolean {
  const arabicCount = (text.match(ARABIC_CHAR_REGEX) ?? []).length;
  const latinCount = (text.match(LATIN_CHAR_REGEX) ?? []).length;
  if (arabicCount === 0 && latinCount === 0) return true;
  return arabicCount >= latinCount * 0.45;
}

function isLegacyBinaryDoc(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 8) return false;
  const bytes = new Uint8Array(buffer, 0, 8);
  // OLE2 Compound Document magic bytes: D0 CF 11 E0 A1 B1 1A E1
  return (
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0
  );
}

function sanitizeHtmlFragment(rawHtml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');
  doc.querySelectorAll('script, style, iframe, object, embed').forEach((el) => el.remove());
  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.toLowerCase().startsWith('on')) {
        el.removeAttribute(attr.name);
      }
      if (
        (attr.name.toLowerCase() === 'href' || attr.name.toLowerCase() === 'src') &&
        attr.value.trim().toLowerCase().startsWith('javascript:')
      ) {
        el.removeAttribute(attr.name);
      }
    }
  });
  return doc.body.innerHTML;
}

function splitTextElementAcrossParagraphs(el: HTMLElement): HTMLElement[] {
  const text = el.textContent?.trim() ?? '';
  if (text.length <= 520) return [el];

  const sentences = text.split(/(?<=[.!؟\n])\s+/);
  const chunks: HTMLElement[] = [];
  let bucket = '';

  for (const sentence of sentences) {
    if ((bucket + ' ' + sentence).trim().length > 480 && bucket) {
      const p = document.createElement('p');
      p.textContent = bucket.trim();
      chunks.push(p);
      bucket = sentence;
    } else {
      bucket = (bucket + ' ' + sentence).trim();
    }
  }
  if (bucket) {
    const p = document.createElement('p');
    p.textContent = bucket.trim();
    chunks.push(p);
  }
  return chunks.length > 0 ? chunks : [el];
}

function paginateHtmlForBookSheets(cleanHtml: string, isRtl: boolean): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanHtml, 'text/html');
  const rawNodes = Array.from(doc.body.children) as HTMLElement[];

  if (rawNodes.length === 0) {
    const plain = doc.body.textContent?.trim();
    if (!plain) {
      return [`<p>${isRtl ? 'مستند فارغ' : 'Empty document'}</p>`];
    }
    return [`<p>${plain}</p>`];
  }

  // Expand very long plain paragraphs so no single block overflows a page sheet
  const blocks: HTMLElement[] = [];
  for (const node of rawNodes) {
    if (
      node.tagName === 'P' &&
      !node.querySelector('img') &&
      (node.textContent?.trim().length ?? 0) > 650
    ) {
      blocks.push(...splitTextElementAcrossParagraphs(node));
    } else {
      blocks.push(node);
    }
  }

  // Offscreen fixed-dimension A4-like book sheet for exact height pagination
  const measurer = document.createElement('div');
  measurer.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  measurer.style.cssText = [
    'position:fixed',
    'left:-99999px',
    'top:0',
    'width:440px',
    'padding:34px 36px',
    'box-sizing:border-box',
    'font-family:"Amiri","Noto Naskh Arabic",Georgia,serif',
    'font-size:14.5px',
    'line-height:1.82',
    'color:#1c1917',
    'visibility:hidden',
    'pointer-events:none',
  ].join(';');
  document.body.appendChild(measurer);

  const MAX_CONTENT_HEIGHT = 560;
  const pageHtmls: string[] = [];
  let currentParts: string[] = [];

  try {
    for (const block of blocks) {
      // Explicit Word page breaks converted by mammoth
      if (block.tagName === 'HR' && block.className.includes('page-break')) {
        if (currentParts.length > 0) {
          pageHtmls.push(currentParts.join(''));
          currentParts = [];
          measurer.innerHTML = '';
        }
        continue;
      }

      const clone = block.cloneNode(true) as HTMLElement;
      clone.style.marginBottom = '10px';
      clone.querySelectorAll('img').forEach((img) => {
        img.style.maxWidth = '100%';
        img.style.maxHeight = '260px';
        img.style.objectFit = 'contain';
      });

      measurer.appendChild(clone);
      const measuredHeight = measurer.scrollHeight;

      if (measuredHeight > MAX_CONTENT_HEIGHT && currentParts.length > 0) {
        pageHtmls.push(currentParts.join(''));
        currentParts = [block.outerHTML];
        measurer.innerHTML = '';
        measurer.appendChild(clone);
      } else {
        currentParts.push(block.outerHTML);
      }
    }

    if (currentParts.length > 0) {
      pageHtmls.push(currentParts.join(''));
    }
  } finally {
    document.body.removeChild(measurer);
  }

  return pageHtmls.length > 0
    ? pageHtmls
    : [`<p>${isRtl ? 'مستند Word' : 'Word Document'}</p>`];
}

function wrapLinesOnCanvas(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) {
    lines.push(line);
  }
  return lines;
}

function renderWordCoverDataUrl(
  title: string,
  previewText: string,
  pageCount: number,
  isRtl: boolean
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 420;
  canvas.height = 560;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Warm book sheet background
  ctx.fillStyle = '#FCF9F2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle paper border
  ctx.strokeStyle = '#DED5C5';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

  // Inner ornamental hairline
  ctx.strokeStyle = '#C2590C';
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  ctx.strokeRect(26, 26, canvas.width - 52, canvas.height - 52);
  ctx.globalAlpha = 1;

  // Top document format tag
  ctx.fillStyle = '#C2590C';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`WORD BOOK · ${pageCount} PAGES`, canvas.width / 2, 62);

  // Divider line
  ctx.beginPath();
  ctx.moveTo(90, 80);
  ctx.lineTo(canvas.width - 90, 80);
  ctx.strokeStyle = '#D6CEBE';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Document title
  ctx.fillStyle = '#1C1917';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  const titleLines = wrapLinesOnCanvas(ctx, title, canvas.width - 96, 3);
  let y = 132;
  for (const l of titleLines) {
    ctx.fillText(l, canvas.width / 2, y);
    y += 38;
  }

  // First sheet preview excerpt
  y += 22;
  ctx.fillStyle = '#57534E';
  ctx.font = '15px Georgia, serif';
  ctx.textAlign = isRtl ? 'right' : 'left';
  const excerptLines = wrapLinesOnCanvas(ctx, previewText, canvas.width - 96, 8);
  const textX = isRtl ? canvas.width - 48 : 48;
  for (const l of excerptLines) {
    ctx.fillText(l, textX, y);
    y += 28;
  }

  // Page 1 footer marker
  ctx.textAlign = 'center';
  ctx.fillStyle = '#A8A29E';
  ctx.font = '12px monospace';
  ctx.fillText('— 1 —', canvas.width / 2, canvas.height - 42);

  return canvas.toDataURL('image/jpeg', 0.88);
}

export async function loadWordPages(
  arrayBuffer: ArrayBuffer,
  fallbackTitle = 'Word Document'
): Promise<WordDocumentInspection> {
  if (isLegacyBinaryDoc(arrayBuffer)) {
    throw new Error(
      'صيغة .doc القديمة غير مدعومة مباشرة؛ يرجى حفظ الملف بصيغة .docx أو PDF.'
    );
  }

  const { default: mammoth } = await import('mammoth/mammoth.browser.js');
  const copy = arrayBuffer.slice(0);
  const { value: rawHtml } = await mammoth.convertToHtml({ arrayBuffer: copy });
  const cleanHtml = sanitizeHtmlFragment(rawHtml);

  const tmp = document.createElement('div');
  tmp.innerHTML = cleanHtml;
  const plainText = (tmp.textContent ?? '').replace(/\s+/g, ' ').trim();
  const isRtl = detectIsRtl(plainText);

  const pageHtmls = paginateHtmlForBookSheets(cleanHtml, isRtl);
  const firstHeading = tmp.querySelector('h1, h2, h3, p')?.textContent?.trim();
  const titleForCover =
    firstHeading && firstHeading.length <= 60 ? firstHeading : fallbackTitle;
  const coverDataUrl = renderWordCoverDataUrl(
    titleForCover,
    plainText.slice(0, 420),
    pageHtmls.length,
    isRtl
  );

  return {
    pageCount: pageHtmls.length,
    pageHtmls,
    isRtl,
    coverDataUrl,
  };
}
