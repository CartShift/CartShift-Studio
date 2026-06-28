import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';

import { sanitizeHtml } from '@/lib/sanitize';
import { logError } from '@/lib/error-handler';

const postsDirectory = path.join(process.cwd(), 'content/blog');

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  category: string;
  image?: string;
  imageAlt?: string;
  socialImage?: string;
  tags?: string[];
  analyzerIntent?: string;
  content: string;
  readingTime?: number;
  wordCount?: number;
  translation?: {
    title: string;
    excerpt: string;
    category: string;
    content: string;
  };
}

/**
 * Pre-process markdown content before remark processing
 * - Converts various numbered formats to standard markdown
 * - Normalizes line endings
 */
function preprocessMarkdown(content: string): string {
  let processed = content;

  // Normalize line endings
  processed = processed.replace(/\r\n/g, '\n');

  // Convert heading formats: "### 1)" or "## 1)" to "### 1." or "## 1."
  processed = processed.replace(/^(#{1,6}\s*)(\d+)\)(\s+)/gm, '$1$2.$3');

  // Convert list formats: "1)" at start of line to "1."
  processed = processed.replace(/^(\d+)\)(\s+)/gm, '$1.$2');

  // Convert "(1)" format to "1." for numbered lists
  processed = processed.replace(/^\((\d+)\)(\s+)/gm, '$1.$2');

  // Ensure proper spacing around headings (add blank line before if needed)
  processed = processed.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');

  // Ensure proper spacing around lists (empty line before list start)
  processed = processed.replace(/([^\n\-*+\d])\n([-*+]|\d+\.)\s/g, '$1\n\n$2 ');

  return processed;
}

/**
 * Post-process HTML content after remark processing
 * - Adds semantic classes for styling
 * - Enhances accessibility
 */
function postprocessHtml(htmlContent: string, slug?: string, locale: 'en' | 'he' = 'en'): string {
  let processed = htmlContent;

  // Add classes to tables for GFM styling
  processed = processed.replace(/<table>/g, '<table class="gfm-table">');

  // Handle GFM task lists - remark-gfm can generate various formats:
  // <li><input type="checkbox" disabled> Item
  // <li><input checked="" disabled="" type="checkbox"> Item
  // <li><input disabled type="checkbox" checked> Item

  // Match any li with input checkbox (flexible attribute order)
  let checkboxIndex = 0;
  const prefix = slug ? `${slug}-` : '';
  processed = processed.replace(
    /<li>(\s*)<input([^>]*type=["']?checkbox["']?[^>]*)>/gi,
    (_match, whitespace, attrs) => {
      const isChecked = /checked/i.test(attrs);
      const checkboxId = `${prefix}task-${checkboxIndex++}`;
      // Create new input without disabled attribute - make it interactive
      const inputHtml = isChecked
        ? `<input type="checkbox" id="${checkboxId}" class="interactive-checkbox" checked />`
        : `<input type="checkbox" id="${checkboxId}" class="interactive-checkbox" />`;
      return `<li class="task-list-item ${isChecked ? 'task-complete' : 'task-incomplete'}" data-checkbox-id="${checkboxId}">${whitespace}${inputHtml}<span class="task-text">`;
    }
  );

  // Close the task-text span before </li>
  processed = processed.replace(
    /(<li class="task-list-item[^"]*">[\s\S]*?)<\/li>/g,
    (match, content) => {
      // Only add closing span if we added an opening one and haven't closed it
      if (content.includes('<span class="task-text">') && !content.includes('</span>')) {
        return content + '</span></li>';
      }
      return match;
    }
  );

  // Mark parent ul of task lists
  processed = processed.replace(
    /<ul>(\s*<li class="task-list-item)/g,
    '<ul class="contains-task-list">$1'
  );

  // Add classes to strikethrough text
  processed = processed.replace(/<del>/g, '<del class="strikethrough">');

  // Enhance footnotes section styling
  processed = processed.replace(
    /<section([^>]*data-footnotes[^>]*)>/g,
    '<section$1 class="footnotes-section">'
  );

  // Ensure code blocks have proper language class preserved
  processed = processed.replace(
    /<pre><code class="language-(\w+)">/g,
    '<pre class="code-block language-$1"><code class="language-$1">'
  );

  // Add classes to blockquotes
  processed = processed.replace(/<blockquote>/g, '<blockquote class="quote">');

  // Add horizontal rule class
  processed = processed.replace(/<hr\s*\/?>/g, '<hr class="section-divider" />');

  // Markdown links render as raw anchors, so localize blog links before they create
  // crawlable /blog/* redirect paths alongside the canonical /{locale}/blog/* URLs.
  processed = processed.replace(/\bhref=(["'])\/blog(?=\/|[#?]|["'])/g, (_match, quote) => {
    return `href=${quote}/${locale}/blog`;
  });

  return processed;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // Split content into English and Hebrew parts
    const contentParts = content.split('---he---');
    let contentEn = contentParts[0];
    let contentHe = contentParts[1] || '';

    // Pre-process markdown
    contentEn = preprocessMarkdown(contentEn);
    if (contentHe) {
      contentHe = preprocessMarkdown(contentHe);
    }

    // Process English content with GFM support
    const processedContentEn = await remark()
      .use(remarkGfm, {
        singleTilde: false, // Use ~~ for strikethrough only
        tableCellPadding: true,
        tablePipeAlign: true,
        firstLineBlank: false, // Compact footnote definitions
      })
      .use(html, {
        sanitize: false, // We'll sanitize after with our custom rules
        allowDangerousHtml: true, // Allow HTML in markdown
      })
      .process(contentEn);

    let contentHtmlEn = postprocessHtml(processedContentEn.toString(), slug, 'en');
    contentHtmlEn = sanitizeHtml(contentHtmlEn);
    // Remove disabled attribute from checkboxes after sanitization (in case it was added back)
    contentHtmlEn = contentHtmlEn.replace(
      /<input([^>]*type=["']?checkbox["']?[^>]*)\s+disabled([^>]*)>/gi,
      '<input$1$2>'
    );
    contentHtmlEn = contentHtmlEn.replace(
      /<input([^>]*)\s+disabled([^>]*type=["']?checkbox["']?[^>]*)>/gi,
      '<input$1$2>'
    );

    // Process Hebrew content if it exists
    let contentHtmlHe = '';
    if (contentHe) {
      const processedContentHe = await remark()
        .use(remarkGfm, {
          singleTilde: false,
          tableCellPadding: true,
          tablePipeAlign: true,
          firstLineBlank: false,
        })
        .use(html, {
          sanitize: false,
          allowDangerousHtml: true,
        })
        .process(contentHe);

      contentHtmlHe = postprocessHtml(processedContentHe.toString(), slug, 'he');
      contentHtmlHe = sanitizeHtml(contentHtmlHe);
      // Remove disabled attribute from checkboxes after sanitization
      contentHtmlHe = contentHtmlHe.replace(
        /<input([^>]*type=["']?checkbox["']?[^>]*)\s+disabled([^>]*)>/gi,
        '<input$1$2>'
      );
      contentHtmlHe = contentHtmlHe.replace(
        /<input([^>]*)\s+disabled([^>]*type=["']?checkbox["']?[^>]*)>/gi,
        '<input$1$2>'
      );
    }

    // Calculate reading time and word count
    const wordsPerMinute = 200;
    const wordCount = contentEn.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);

    return {
      slug,
      title: data.title || '',
      date: data.date || '',
      excerpt: data.excerpt || '',
      category: data.category || 'General',
      image: data.image || '',
      imageAlt: data.imageAlt || data.title || '',
      socialImage: data.socialImage || data.image || '',
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      analyzerIntent: typeof data.analyzerIntent === 'string' ? data.analyzerIntent : undefined,
      content: contentHtmlEn,
      readingTime,
      wordCount,
      translation: {
        title: data.title_he || data.title || '',
        excerpt: data.excerpt_he || data.excerpt || '',
        category: data.category_he || data.category || 'General',
        content: contentHtmlHe || contentHtmlEn,
      },
    };
  } catch (error) {
    logError(`Error reading post ${slug}`, error);
    return null;
  }
}

export function getPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  return fs
    .readdirSync(postsDirectory)
    .filter(file => file.endsWith('.md'))
    .map(file => file.replace(/\.md$/, ''));
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const slugs = getPostSlugs();
  const posts = await Promise.all(
    slugs.map(async slug => {
      const post = await getPostBySlug(slug);
      return post;
    })
  );

  return posts
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
}

export async function getCategories(): Promise<string[]> {
  const posts = await getAllPosts();
  const categories = new Set<string>();

  posts.forEach(post => {
    if (post.category) {
      categories.add(post.category);
    }
  });

  return Array.from(categories);
}
