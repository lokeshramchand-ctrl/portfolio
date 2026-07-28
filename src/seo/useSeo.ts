import { useHead, useSeoMeta } from '@unhead/vue';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_LOCALE,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  TWITTER_HANDLE,
  absoluteUrl,
} from './constants';

interface SeoOptions {
  title?: string;
  description?: string;
  /** route path, e.g. '/blog/my-post' — used to build the canonical + og:url */
  path: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: (Record<string, unknown> | undefined)[];
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    tags?: string[];
  };
}

export function useSeo(options: SeoOptions) {
  const title = options.title ?? DEFAULT_TITLE;
  const description = options.description ?? DEFAULT_DESCRIPTION;
  const image = options.image ?? DEFAULT_OG_IMAGE;
  const url = absoluteUrl(options.path);
  const type = options.type ?? 'website';

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogImage: image,
    ogUrl: url,
    ogSiteName: SITE_NAME,
    ogType: type,
    ogLocale: DEFAULT_LOCALE,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
    twitterSite: TWITTER_HANDLE,
    robots: options.noindex ? 'noindex, nofollow' : 'index, follow',
    articlePublishedTime: options.article?.publishedTime,
    articleModifiedTime: options.article?.modifiedTime,
    articleTag: options.article?.tags,
  });

  useHead({
    link: [{ rel: 'canonical', href: url }],
    script: (options.jsonLd ?? [])
      .filter((schema): schema is Record<string, unknown> => Boolean(schema))
      .map((schema) => ({
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schema),
      })),
  });
}
