import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on infrastructure, self-hosting, and building software.",
};

export default function BlogPage() {
  return (
    <div className="padding-x padding-y">
      <p className="font-mono text-sm text-amber-400">Writing /</p>
      <h1 className="font-title heading-2 mt-3 text-paper-500">Blog</h1>

      <ul className="mt-12 divide-y divide-paper-500/10 border-t border-paper-500/10">
        {blogPosts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex flex-col gap-2 py-8 md:flex-row md:items-baseline md:justify-between md:gap-8"
              data-cursor="hover"
            >
              <div>
                <h2 className="font-title heading-4 text-paper-500 transition-colors group-hover:text-amber-400">
                  {post.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-paper-300">
                  {post.excerpt}
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-paper-500/15 px-3 py-1 font-mono text-xs text-paper-100"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="font-mono text-xs whitespace-nowrap text-paper-100">
                {post.date}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
