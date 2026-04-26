import sanitizeHtml from 'sanitize-html';

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'ul', 'ol', 'li', 'a', 'span', 'h1', 'h2', 'h3'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    }),
  },
};

export function sanitizeDescriptionHtml(html: string) {
  return sanitizeHtml(html, sanitizeOptions);
}

export function htmlToPlain(html: string) {
  const stripped = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
  return stripped.replace(/\s+/g, ' ').trim();
}

/**
 * Minimal HTML to WhatsApp-ish plain text (bold/italic/strike/lists/links).
 */
export function htmlToWhatsApp(html: string) {
  let s = sanitizeDescriptionHtml(html);
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/p>/gi, '\n\n');
  s = s.replace(/<p[^>]*>/gi, '');
  s = s.replace(/<h[1-3][^>]*>/gi, '\n');
  s = s.replace(/<\/h[1-3]>/gi, '\n');
  s = s.replace(/<strong[^>]*>|<b[^>]*>/gi, '*');
  s = s.replace(/<\/strong>|<\/b>/gi, '*');
  s = s.replace(/<em[^>]*>|<i[^>]*>/gi, '_');
  s = s.replace(/<\/em>|<\/i>/gi, '_');
  s = s.replace(/<s[^>]*>|<strike[^>]*>/gi, '~');
  s = s.replace(/<\/s>|<\/strike>/gi, '~');
  s = s.replace(/<u[^>]*>/gi, '');
  s = s.replace(/<\/u>/gi, '');
  s = s.replace(/<ul[^>]*>/gi, '\n');
  s = s.replace(/<\/ul>/gi, '\n');
  s = s.replace(/<ol[^>]*>/gi, '\n');
  s = s.replace(/<\/ol>/gi, '\n');
  s = s.replace(/<li[^>]*>/gi, '• ');
  s = s.replace(/<\/li>/gi, '\n');
  s = s.replace(/<a[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/gi, (_m, href, text) => {
    const label = String(text || '').trim() || String(href);
    return `${label} (${href})`;
  });
  s = s.replace(/<[^>]+>/g, '');
  return s.replace(/\n{3,}/g, '\n\n').trim();
}
