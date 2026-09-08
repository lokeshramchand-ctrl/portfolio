import { marked } from 'marked';
import DOMPurify from 'dompurify';

export interface TocItem {
  id: string;
  text: string;
  depth: 2 | 3;
}

/** Strips the leading YAML frontmatter block so it never falls into markdown's setext-heading parsing (a paragraph directly followed by `---` becomes an H2). */
export function stripFrontmatter(markdown: string): string {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_~[\]()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

/**
 * Parses markdown to HTML the same way BlogPostView always has (via
 * `marked`), but with a custom heading renderer that slugifies h2/h3
 * text into stable, deduplicated ids and collects them into a flat TOC
 * list alongside the HTML — one pass, no second markdown parse.
 */
export function parseMarkdownWithToc(markdown: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const seenIds = new Map<string, number>();

  const renderer = new marked.Renderer();
  renderer.heading = function (token) {
    const inner = this.parser.parseInline(token.tokens);

    if (token.depth !== 2 && token.depth !== 3) {
      return `<h${token.depth}>${inner}</h${token.depth}>\n`;
    }

    const base = slugifyHeading(token.text) || 'section';
    const occurrence = seenIds.get(base) ?? 0;
    seenIds.set(base, occurrence + 1);
    const id = occurrence > 0 ? `${base}-${occurrence}` : base;

    toc.push({ id, text: token.text, depth: token.depth });
    return `<h${token.depth} id="${id}">${inner}</h${token.depth}>\n`;
  };

  const rawHtml = marked.parse(stripFrontmatter(markdown), { renderer }) as string;
  const html = DOMPurify.sanitize(rawHtml);
  return { html, toc };
}
