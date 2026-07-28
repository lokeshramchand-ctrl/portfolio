import { blogPosts } from '@/data';
import {
  AUTHOR_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  GITHUB_URL,
  LINKEDIN_URL,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from './constants';

export type BlogPostMeta = (typeof blogPosts)[number];

/** blogPosts stores human dates like "July 24, 2026"; JSON-LD needs ISO 8601. */
export function toIsoDate(humanDate: string): string | undefined {
  const parsed = new Date(humanDate);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function personSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: AUTHOR_NAME,
    jobTitle: 'Software Engineer',
    description: DEFAULT_DESCRIPTION,
    image: DEFAULT_OG_IMAGE,
    url: SITE_URL,
    sameAs: [GITHUB_URL, LINKEDIN_URL].filter(Boolean),
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'en',
  };
}

export function profilePageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: personSchema(),
    url: SITE_URL,
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function collectionPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Writing & Thinking',
    url: absoluteUrl('/blog'),
    isPartOf: {
      '@type': 'Blog',
      name: `${SITE_NAME} — Blog`,
      url: absoluteUrl('/blog'),
    },
    hasPart: blogPosts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: absoluteUrl(`/blog/${post.slug}`),
      datePublished: toIsoDate(post.date),
      description: post.excerpt,
    })),
  };
}

export function blogPostingSchema(
  post: BlogPostMeta,
  extra: { wordCount?: number } = {},
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: toIsoDate(post.date),
    dateModified: toIsoDate(post.date),
    url: absoluteUrl(`/blog/${post.slug}`),
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    keywords: post.tags?.join(', '),
    wordCount: extra.wordCount,
    image: DEFAULT_OG_IMAGE,
    inLanguage: 'en',
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Person',
      name: AUTHOR_NAME,
      url: SITE_URL,
    },
  };
}
