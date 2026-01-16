import sanitizeHtmlLib from 'sanitize-html';

export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: [
      // Block elements
      'p',
      'br',
      'hr',
      'div',
      'section',
      'article',
      // Headings
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      // Text formatting
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'del',
      'ins',
      'mark',
      'small',
      'sub',
      'sup',
      // Lists
      'ul',
      'ol',
      'li',
      // Links and media
      'a',
      'img',
      'figure',
      'figcaption',
      // Quotes and code
      'blockquote',
      'code',
      'pre',
      'kbd',
      'samp',
      'var',
      // Tables (GFM)
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'th',
      'td',
      'caption',
      'colgroup',
      'col',
      // Definition lists
      'dl',
      'dt',
      'dd',
      // Other semantic elements
      'abbr',
      'cite',
      'dfn',
      'q',
      'time',
      'address',
      // Task lists (GFM) - input for checkboxes
      'input',
      // Spans for styling
      'span',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      input: ['type', 'checked', 'disabled', 'class'], // For GFM task lists
      td: ['align', 'valign', 'colspan', 'rowspan'],
      th: ['align', 'valign', 'colspan', 'rowspan', 'scope'],
      col: ['span', 'width'],
      colgroup: ['span'],
      time: ['datetime'],
      abbr: ['title'],
      q: ['cite'],
      blockquote: ['cite', 'class'],
      ol: ['start', 'type', 'reversed', 'class'],
      ul: ['class'],
      li: ['value', 'class'],
      span: ['class'],
      table: ['class'],
      pre: ['class'],
      code: ['class'],
      hr: ['class'],
      del: ['class'],
      '*': ['id', 'data-*'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
    // Transform tags if needed
    transformTags: {
      // Ensure external links open in new tab
      a: (tagName, attribs) => {
        const href = attribs.href || '';
        if (
          href.startsWith('http') &&
          !href.includes(process.env.NEXT_PUBLIC_SITE_URL || 'cart-shift.com')
        ) {
          return {
            tagName: 'a',
            attribs: {
              ...attribs,
              target: '_blank',
              rel: 'noopener noreferrer',
            },
          };
        }
        return { tagName, attribs };
      },
    },
  });
}

export function sanitizeString(input: string): string {
  return sanitizeHtmlLib(input, { allowedTags: [] });
}
