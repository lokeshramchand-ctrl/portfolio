import { computed, type MaybeRefOrGetter, toValue } from 'vue';
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
    tags?: readonly string[];
  };
}

/**
 * Must be called synchronously during a component's setup() — unhead's
 * useHead/useSeoMeta read Vue's injection context, which is only available
 * on the setup call stack. Pass a getter/ref/computed for `options` so this
 * can be registered once and still update reactively on later navigations
 * (e.g. an in-place route param change) instead of being re-invoked outside
 * setup, which would throw "useHead() was called without provide context".
 */
export function useSeo(options: MaybeRefOrGetter<SeoOptions>) {
  const title = computed(() => toValue(options).title ?? DEFAULT_TITLE);
  const description = computed(() => toValue(options).description ?? DEFAULT_DESCRIPTION);
  const image = computed(() => toValue(options).image ?? DEFAULT_OG_IMAGE);
  const url = computed(() => absoluteUrl(toValue(options).path));
  const type = computed(() => toValue(options).type ?? 'website');

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
    robots: computed(() => (toValue(options).noindex ? 'noindex, nofollow' : 'index, follow')),
    articlePublishedTime: computed(() => toValue(options).article?.publishedTime),
    articleModifiedTime: computed(() => toValue(options).article?.modifiedTime),
    articleTag: computed(() => toValue(options).article?.tags),
  });

  useHead({
    link: [
      { rel: 'canonical', href: url },
      {
        rel: 'alternate',
        type: 'application/rss+xml',
        title: `${SITE_NAME} — Blog`,
        href: absoluteUrl('/rss.xml'),
      },
    ],
    script: computed(() =>
      (toValue(options).jsonLd ?? [])
        .filter((schema): schema is Record<string, unknown> => Boolean(schema))
        .map((schema) => ({
          type: 'application/ld+json',
          innerHTML: JSON.stringify(schema),
        })),
    ),
  });
}
