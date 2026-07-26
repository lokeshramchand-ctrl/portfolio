import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import { blogPosts } from "@/lib/data";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

function findPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();

  let html: string;
  try {
    const raw = await readFile(
      path.join(process.cwd(), "public", "blogs", `${slug}.md`),
      "utf-8",
    );
    html = await marked.parse(raw);
  } catch {
    notFound();
  }

  return (
    <article className="padding-x padding-y">
      <Link
        href="/blog"
        className="font-mono text-sm text-amber-400 hover:text-amber-500"
        data-cursor="hover"
      >
        ← Blog
      </Link>

      <header className="mt-8 max-w-3xl border-b border-paper-500/10 pb-10">
        <p className="font-mono text-xs text-paper-100">{post.date}</p>
        <h1 className="font-title heading-2 mt-3 text-paper-500">
          {post.title}
        </h1>
        <ul className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-paper-500/15 px-3 py-1 font-mono text-xs text-paper-100"
            >
              {tag}
            </li>
          ))}
        </ul>
      </header>

      <div
        className="prose prose-invert mt-10 max-w-3xl prose-headings:font-title prose-headings:text-paper-500 prose-p:text-paper-300 prose-a:text-amber-400 prose-strong:text-paper-400 prose-code:text-amber-300"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
