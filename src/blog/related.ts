import type { BlogPostMeta } from '@/seo/schema';

/**
 * Ranks other posts by shared-tag count (ties broken by recency), and
 * drops anything with zero overlap rather than padding out to `limit`
 * with unrelated posts.
 */
export function relatedPosts(
  current: BlogPostMeta,
  allPosts: readonly BlogPostMeta[],
  limit = 3,
): BlogPostMeta[] {
  return allPosts
    .filter((post) => post.slug !== current.slug)
    .map((post) => ({
      post,
      score: post.tags.filter((tag) => current.tags.includes(tag)).length,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || Date.parse(b.post.date) - Date.parse(a.post.date))
    .slice(0, limit)
    .map((entry) => entry.post);
}
