const ALLOWED_TAGS = new Set([
  'B',
  'BLOCKQUOTE',
  'BR',
  'DIV',
  'EM',
  'I',
  'LI',
  'OL',
  'P',
  'STRONG',
  'U',
  'UL',
]);
const BLOCKED_TAGS = new Set([
  'AUDIO',
  'EMBED',
  'IFRAME',
  'IMG',
  'MATH',
  'OBJECT',
  'SCRIPT',
  'STYLE',
  'SVG',
  'VIDEO',
]);
const ALLOWED_ALIGNMENTS = new Set(['left', 'center', 'right', 'justify']);

export function sanitizeTicketDescription(value: string): string {
  const source = document.createElement('template');
  source.innerHTML = value;
  const output = document.createElement('div');

  const copySafeNodes = (nodes: NodeList, target: HTMLElement): void => {
    for (const node of Array.from(nodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        target.appendChild(document.createTextNode(node.textContent ?? ''));
        continue;
      }
      if (!(node instanceof HTMLElement)) {
        continue;
      }

      const tagName = node.tagName;
      if (BLOCKED_TAGS.has(tagName)) {
        continue;
      }
      if (!ALLOWED_TAGS.has(tagName)) {
        copySafeNodes(node.childNodes, target);
        continue;
      }

      const safeElement = document.createElement(tagName.toLocaleLowerCase());
      const alignment = node.style.textAlign;
      if (ALLOWED_ALIGNMENTS.has(alignment)) {
        safeElement.style.textAlign = alignment;
      }
      const marginInlineStart = node.style.marginInlineStart;
      if (/^(0|[1-6](\.\d+)?rem)$/.test(marginInlineStart)) {
        safeElement.style.marginInlineStart = marginInlineStart;
        const indent = Math.round(Number.parseFloat(marginInlineStart) / 1.5);
        if (indent > 0) {
          safeElement.dataset['indent'] = String(Math.min(indent, 4));
        }
      }
      copySafeNodes(node.childNodes, safeElement);
      target.appendChild(safeElement);
    }
  };

  copySafeNodes(source.content.childNodes, output);
  return output.innerHTML;
}

export function ticketDescriptionText(value: string | null): string {
  if (!value) {
    return '';
  }

  const container = document.createElement('div');
  container.innerHTML = sanitizeTicketDescription(value);
  return container.textContent ?? '';
}
