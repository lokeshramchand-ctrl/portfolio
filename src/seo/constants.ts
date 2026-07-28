import { heroText, socialLinks } from '@/data';

export const SITE_URL = 'https://lokeshrc.me';
export const SITE_NAME = 'Lokesh Ram Chand — Portfolio';
export const AUTHOR_NAME = 'Lokesh Ram Chand B';
export const DEFAULT_TITLE = 'Lokesh Ram Chand | Software Engineer';
export const DEFAULT_DESCRIPTION = heroText;
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.webp`;
export const DEFAULT_LOCALE = 'en_US';

const twitterUrl = socialLinks.find((link) => link.label === 'X')?.url ?? '';
export const TWITTER_HANDLE = twitterUrl
  ? `@${twitterUrl.replace(/\/+$/, '').split('/').pop()}`
  : undefined;

export const GITHUB_URL =
  socialLinks.find((link) => link.label === 'GitHub')?.url ?? '';
export const LINKEDIN_URL =
  socialLinks.find((link) => link.label === 'LinkedIn')?.url ?? '';

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
