/**
 * Utility for sanitizing, normalizing, and converting Job Description content.
 * 
 * Separation of Concerns:
 * - Sanitized Semantic HTML: Used exclusively for rich visual display inside the editor.
 * - Normalized Plain Text: Used for character counting, length validation, backend storage,
 *   database queries, and Gemini AI analysis.
 */

/**
 * Converts any HTML string or DOM node into clean, normalized, human-readable plain text.
 * - Headings become standalone lines followed by double newlines.
 * - Unordered list items (<ul><li>) become "• item" followed by newline.
 * - Ordered list items (<ol><li>) become "1. item", "2. item", etc.
 * - Paragraphs and block divs are separated by double newlines.
 * - <br> becomes a single newline.
 * - Duplicate bullet markers (e.g. "• • item") are strictly prevented.
 * - HTML tags, classes, and styles are never included in the output.
 * - Legitimate user text like [1], [2], years (2024), and URLs are fully preserved.
 */
export function htmlToNormalizedPlainText(input: string | Node): string {
  let rootNode: Node;

  if (typeof input === 'string') {
    if (!input.trim()) return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<body>${input}</body>`, 'text/html');
    rootNode = doc.body;
  } else {
    rootNode = input;
  }

  const result: string[] = [];

  function walk(node: Node, inList: 'ul' | 'ol' | null = null, listIndex = 0) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      result.push(text);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    // Skip unwanted non-content elements
    if (['script', 'style', 'noscript', 'iframe', 'svg', 'button', 'form'].includes(tagName)) {
      return;
    }

    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
      result.push('\n\n');
      for (const child of Array.from(el.childNodes)) {
        walk(child);
      }
      result.push('\n\n');
      return;
    }

    if (tagName === 'p' || tagName === 'div' || tagName === 'section' || tagName === 'article') {
      result.push('\n\n');
      for (const child of Array.from(el.childNodes)) {
        walk(child);
      }
      result.push('\n\n');
      return;
    }

    if (tagName === 'ul') {
      result.push('\n');
      let idx = 0;
      for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName.toLowerCase() === 'li') {
          walk(child, 'ul', idx++);
        } else {
          walk(child);
        }
      }
      result.push('\n');
      return;
    }

    if (tagName === 'ol') {
      result.push('\n');
      let idx = 0;
      for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName.toLowerCase() === 'li') {
          walk(child, 'ol', idx++);
        } else {
          walk(child);
        }
      }
      result.push('\n');
      return;
    }

    if (tagName === 'li') {
      // Gather inner text of this li
      const tempTexts: string[] = [];
      for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          tempTexts.push(child.textContent || '');
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const childEl = child as HTMLElement;
          const childTag = childEl.tagName.toLowerCase();
          if (childTag === 'ul' || childTag === 'ol') {
            // Nested list
            walk(child);
          } else {
            tempTexts.push(childEl.textContent || '');
          }
        }
      }

      let liText = tempTexts.join('').trim();
      // Prevent duplicate bullet characters like "• • item" or "- - item"
      liText = liText.replace(/^([•*+\-–—]|\u2022|\u25cf|\u25cb|\u25aa|\u25fe)\s*/, '');
      // Also prevent duplicate numbered markers like "1. 1. item"
      liText = liText.replace(/^\d+[\.\)]\s*/, '');

      if (liText) {
        if (inList === 'ol') {
          result.push(`\n${listIndex + 1}. ${liText}`);
        } else {
          result.push(`\n• ${liText}`);
        }
      }
      return;
    }

    if (tagName === 'br') {
      result.push('\n');
      return;
    }

    // Default for inline nodes (strong, em, a, span, etc.)
    for (const child of Array.from(el.childNodes)) {
      walk(child, inList, listIndex);
    }
  }

  walk(rootNode);

  const rawText = result.join('');
  return cleanUpNormalizedText(rawText);
}

/**
 * Cleans excessive blank lines and whitespace while strictly maintaining
 * proper section separation, bullets, and line breaks.
 */
export function cleanUpNormalizedText(text: string): string {
  if (!text) return '';

  return text
    // Replace carriage returns
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Replace non-breaking spaces with standard space
    .replace(/\u00A0/g, ' ')
    // Normalize lines that have multiple spaces/tabs
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    // Collapse 3 or more consecutive newlines into exactly two (standard paragraph spacing)
    .replace(/\n{3,}/g, '\n\n')
    // Trim leading/trailing whitespace of the whole document
    .trim();
}

/**
 * Aggressively sanitizes dirty pasted HTML to ensure zero malicious tags,
 * removes all external classes, IDs, inline styling, and external fonts,
 * and preserves semantic document structure (headings, paragraphs, bold, lists, safe links).
 */
export function sanitizeAndNormalizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml || !dirtyHtml.trim()) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(dirtyHtml, 'text/html');
  const body = doc.body;

  // 1. Remove dangerous, unsafe, or layout-polluting elements
  const unsafeSelectors = [
    'script', 'style', 'noscript', 'iframe', 'frame', 'object', 'embed',
    'svg', 'img', 'canvas', 'audio', 'video', 'form', 'input', 'button',
    'select', 'textarea', 'link', 'meta', 'nav', 'header', 'footer',
    'aside', 'template', 'applet'
  ];
  for (const selector of unsafeSelectors) {
    const elements = Array.from(body.querySelectorAll(selector));
    for (const el of elements) {
      el.remove();
    }
  }

  // 2. Remove job-board tracking / action noise elements if present
  const noiseSelectors = [
    '[class*="apply"]', '[id*="apply"]',
    '[class*="save-job"]', '[id*="save-job"]',
    '[class*="share"]', '[id*="share"]'
  ];
  for (const selector of noiseSelectors) {
    const elements = Array.from(body.querySelectorAll(selector));
    for (const el of elements) {
      const text = (el.textContent || '').trim().toLowerCase();
      if (
        text.includes('apply on company site') ||
        text.includes('apply now') ||
        text.includes('save this job') ||
        text.includes('report job') ||
        text.includes('share this job')
      ) {
        el.remove();
      }
    }
  }

  // 3. Process every remaining element recursively
  function cleanElement(el: HTMLElement): Node | null {
    const tag = el.tagName.toLowerCase();

    // Disallowed tag check
    if (unsafeSelectors.includes(tag)) {
      return null;
    }

    // Strip ALL attributes from the element EXCEPT safe href on <a>
    const attrNames = Array.from(el.getAttributeNames());
    for (const attr of attrNames) {
      if (tag === 'a' && attr.toLowerCase() === 'href') {
        continue;
      }
      el.removeAttribute(attr);
    }

    // Sanitize anchor tags
    if (tag === 'a') {
      const rawHref = el.getAttribute('href') || '';
      if (/^https?:\/\//i.test(rawHref) || /^mailto:/i.test(rawHref)) {
        el.setAttribute('href', rawHref);
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      } else {
        // Remove unsafe href (e.g. javascript:, data:)
        el.removeAttribute('href');
      }
    }

    // Clean all children first
    const childNodes = Array.from(el.childNodes);
    for (const child of childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const cleanedChild = cleanElement(child as HTMLElement);
        if (!cleanedChild) {
          child.remove();
        } else if (cleanedChild !== child) {
          el.insertBefore(cleanedChild, child);
          child.remove();
        }
      }
    }

    // Transform headings into standardized h3
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
      const heading = doc.createElement('h3');
      while (el.firstChild) {
        heading.appendChild(el.firstChild);
      }
      return heading;
    }

    // Transform generic block containers (div, section, article, blockquote) into <p>
    if (['div', 'section', 'article', 'blockquote', 'aside'].includes(tag)) {
      const hasBlockChildren = Array.from(el.children).some(c => 
        ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'div'].includes(c.tagName.toLowerCase())
      );
      if (hasBlockChildren) {
        const frag = doc.createDocumentFragment();
        while (el.firstChild) {
          frag.appendChild(el.firstChild);
        }
        return frag;
      }

      // Check if div text begins with a bullet character: convert to <ul><li>...</li></ul>
      const trimmed = (el.textContent || '').trim();
      const bulletMatch = trimmed.match(/^([•*+\-–—]|\u2022|\u25cf|\u25cb|\u25aa|\u25fe)\s+(.+)$/);
      if (bulletMatch) {
        const ul = doc.createElement('ul');
        const li = doc.createElement('li');
        li.textContent = bulletMatch[2];
        ul.appendChild(li);
        return ul;
      }

      const p = doc.createElement('p');
      while (el.firstChild) {
        p.appendChild(el.firstChild);
      }
      return p;
    }

    // Strip duplicate bullet character inside <li> elements
    if (tag === 'li') {
      const firstChild = el.firstChild;
      if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
        firstChild.textContent = (firstChild.textContent || '').replace(
          /^\s*([•*+\-–—]|\u2022|\u25cf|\u25cb|\u25aa|\u25fe)\s*/,
          ''
        );
      }
      return el;
    }

    // Standardize bold/strong
    if (tag === 'b') {
      const strong = doc.createElement('strong');
      while (el.firstChild) {
        strong.appendChild(el.firstChild);
      }
      return strong;
    }

    // Standardize italic/em
    if (tag === 'i') {
      const em = doc.createElement('em');
      while (el.firstChild) {
        em.appendChild(el.firstChild);
      }
      return em;
    }

    // Unwrap useless formatting/span wrappers that have no semantic value
    if (['span', 'font', 'center'].includes(tag)) {
      const frag = doc.createDocumentFragment();
      while (el.firstChild) {
        frag.appendChild(el.firstChild);
      }
      return frag;
    }

    return el;
  }

  // Iterate over root children
  const rootChildren = Array.from(body.childNodes);
  const container = doc.createElement('div');

  for (const child of rootChildren) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const cleaned = cleanElement(child as HTMLElement);
      if (cleaned) {
        container.appendChild(cleaned);
      }
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = (child.textContent || '').trim();
      if (text) {
        const p = doc.createElement('p');
        p.textContent = text;
        container.appendChild(p);
      }
    }
  }

  // Group adjacent <li> elements if they got separated, or wrap standalone <li> in <ul>
  const postChildren = Array.from(container.children);
  let currentUl: HTMLUListElement | null = null;

  for (const child of postChildren) {
    if (child.tagName.toLowerCase() === 'li') {
      if (!currentUl) {
        currentUl = doc.createElement('ul');
        container.insertBefore(currentUl, child);
      }
      currentUl.appendChild(child);
    } else {
      currentUl = null;
    }
  }

  // Remove empty paragraphs
  const paragraphs = Array.from(container.querySelectorAll('p'));
  for (const p of paragraphs) {
    if (!p.textContent?.trim() && !p.querySelector('br')) {
      p.remove();
    }
  }

  return container.innerHTML.trim();
}

/**
 * Converts structured plain text into semantic HTML for the editor.
 * Used when loading plain text or receiving AI-generated descriptions.
 */
export function plainTextToHtml(plainText: string): string {
  if (!plainText || !plainText.trim()) return '';

  const lines = plainText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n');

  const htmlParts: string[] = [];
  let inUl = false;
  let inOl = false;
  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const content = currentParagraphLines.join('<br />');
      htmlParts.push(`<p>${content}</p>`);
      currentParagraphLines = [];
    }
  };

  const closeLists = () => {
    if (inUl) {
      htmlParts.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      htmlParts.push('</ol>');
      inOl = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushParagraph();
      closeLists();
      continue;
    }

    // Check for bullet list item: •, *, -, etc.
    const bulletMatch = trimmed.match(/^([•*+\-–—]|\u2022|\u25cf|\u25cb|\u25aa|\u25fe)\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      if (inOl) {
        htmlParts.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        htmlParts.push('<ul>');
        inUl = true;
      }
      htmlParts.push(`<li>${escapeHtml(bulletMatch[2])}</li>`);
      continue;
    }

    // Check for numbered list item: 1. or 1)
    const numberedMatch = trimmed.match(/^(\d+)[\.\)]\s+(.+)$/);
    if (numberedMatch) {
      flushParagraph();
      if (inUl) {
        htmlParts.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        htmlParts.push('<ol>');
        inOl = true;
      }
      htmlParts.push(`<li>${escapeHtml(numberedMatch[2])}</li>`);
      continue;
    }

    // Close any active lists before checking for headings or paragraphs
    closeLists();

    // Check for heading-like line:
    // 1. Ends in a colon (e.g. "Key Responsibilities:") and is reasonably short (< 80 chars)
    // 2. Starts with markdown heading # / ## / ###
    // 3. Known section header names
    const isMarkdownHeading = /^#{1,6}\s+(.+)$/.test(trimmed);
    const isColonHeading = trimmed.endsWith(':') && trimmed.length < 80 && !trimmed.includes('.');
    const isShortUppercaseHeading = /^[A-Z\s]{4,40}$/.test(trimmed) && trimmed.length < 40;
    const isKnownSection = /^(about\s+us|overview|responsibilities|key\s+responsibilities|requirements|qualifications|skills|what\s+you'll\s+do|what\s+we\s+offer|benefits|who\s+you\s+are)$/i.test(trimmed.replace(/[:\-]/g, '').trim());

    if (isMarkdownHeading || isColonHeading || isShortUppercaseHeading || isKnownSection) {
      flushParagraph();
      const headingText = trimmed.replace(/^#{1,6}\s+/, '');
      htmlParts.push(`<h3>${escapeHtml(headingText)}</h3>`);
      continue;
    }

    // Normal paragraph text
    currentParagraphLines.push(escapeHtml(trimmed));
  }

  flushParagraph();
  closeLists();

  return htmlParts.join('');
}

/**
 * Escapes HTML entities to prevent raw injection when converting plain text to HTML.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * High-level paste normalizer:
 * Takes raw clipboard data (`text/html` and `text/plain`),
 * produces both clean semantic HTML for visual display and
 * normalized structured plain text for character counting and AI matching.
 */
export function normalizePastedContent(
  clipboardHtml: string | null | undefined,
  clipboardText: string | null | undefined
): { html: string; plainText: string } {
  // Case 1: We have HTML clipboard data
  if (clipboardHtml && clipboardHtml.trim()) {
    const sanitizedHtml = sanitizeAndNormalizeHtml(clipboardHtml);
    const normalizedText = htmlToNormalizedPlainText(sanitizedHtml);

    // If sanitized HTML yielded meaningful content, return both
    if (normalizedText.length > 0) {
      return {
        html: sanitizedHtml,
        plainText: normalizedText
      };
    }
  }

  // Case 2: We only have plain text, or HTML didn't yield content
  const text = (clipboardText || '').trim();
  if (!text) {
    return { html: '', plainText: '' };
  }

  const structuredHtml = plainTextToHtml(text);
  const normalizedText = htmlToNormalizedPlainText(structuredHtml || text);

  return {
    html: structuredHtml,
    plainText: normalizedText
  };
}
