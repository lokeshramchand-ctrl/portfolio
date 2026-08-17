<template>
  <div
    v-if="!isLoading && !error"
    class="fixed top-0 left-0 z-40 h-[3px] bg-flax-smoke-600 pointer-events-none origin-left transition-transform duration-150 ease-out"
    :style="{ width: '100%', transform: `scaleX(${readingProgress})` }"
  ></div>

  <section class="padding-x min-h-svh pt-[15vh] pb-32">
    <div class="w-full max-w-5xl mx-auto z-10 relative lg:grid lg:grid-cols-[1fr_220px] lg:gap-16 lg:items-start">
      <div class="w-full max-w-3xl">
        <router-link to="/blog" class="post-back-btn inline-flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-widest text-flax-smoke-500 hover:text-flax-smoke-900 transition-colors duration-500 mb-12">
          <span>←</span> Back to Journal
        </router-link>

        <div v-if="isLoading" class="heading-4 font-mono animate-pulse text-flax-smoke-400">
          Loading data stream...
        </div>

        <div v-else-if="error" class="heading-4 font-mono text-flax-smoke-500">
          {{ error }}
        </div>

        <article v-else ref="articleRef" class="will-change-transform">
          <header class="mb-16 pb-12 border-b-2 border-flax-smoke-200">
            <p class="post-meta font-mono text-sm font-bold text-flax-smoke-500 uppercase mb-6">
              {{ postMeta?.date }}<span v-if="readingTime"> · {{ readingTime }}</span>
            </p>

            <h1 class="post-title heading-2 font-fancy font-bold leading-[0.9] tracking-tighter uppercase text-balance mb-8 text-flax-smoke-900">
              {{ postMeta?.title }}
            </h1>

            <div class="flex flex-wrap gap-3">
              <Tag v-for="tag in postMeta?.tags" :key="tag" class="post-tag">{{ tag }}</Tag>
            </div>
          </header>

          <div class="markdown-content" v-html="parsedMarkdown"></div>
        </article>

        <section v-if="!isLoading && !error && related.length > 0" class="mt-24 pt-16 border-t-2 border-flax-smoke-200">
          <p class="font-mono text-xs font-bold text-flax-smoke-400 uppercase tracking-[0.2em] mb-8">
            Related Posts
          </p>
          <div class="flex flex-col gap-8">
            <router-link
              v-for="post in related"
              :key="post.slug"
              :to="`/blog/${post.slug}`"
              class="group block"
            >
              <p class="font-mono text-sm font-bold text-flax-smoke-500 uppercase mb-2">{{ post.date }}</p>
              <h3 class="heading-5 font-fancy font-bold group-hover:translate-x-2 transition-transform duration-500 text-flax-smoke-900">
                {{ post.title }}
              </h3>
            </router-link>
          </div>
        </section>
      </div>

      <aside v-if="tocItems.length > 0" class="hidden lg:block sticky top-32">
        <p class="font-mono text-xs font-bold text-flax-smoke-400 uppercase tracking-[0.2em] mb-4">
          On This Page
        </p>
        <nav class="flex flex-col gap-3 border-l-2 border-flax-smoke-100">
          <a
            v-for="item in tocItems"
            :key="item.id"
            :href="`#${item.id}`"
            class="text-sm leading-snug -ml-px border-l-2 transition-colors duration-300"
            :class="[
              item.depth === 3 ? 'pl-8' : 'pl-4',
              activeTocId === item.id
                ? 'border-flax-smoke-900 text-flax-smoke-900 font-semibold'
                : 'border-transparent text-flax-smoke-500 hover:text-flax-smoke-900',
            ]"
            @click.prevent="scrollToHeading(item.id)"
          >
            {{ item.text }}
          </a>
        </nav>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
  import { useRoute } from 'vue-router';
  import { useHead } from '@unhead/vue';
  import ScrollTrigger from 'gsap/ScrollTrigger';
  import { lenis } from '@/main';
  import { Tag } from '@/components/common';
  import { blogPosts } from '@/generated/blogIndex';
  import { animateBlogPostEnter } from '@/animations'; // Adjust path if needed
  import { useSeo } from '@/seo/useSeo';
  import { blogPostingSchema, breadcrumbSchema, toIsoDate, type BlogPostMeta } from '@/seo/schema';
  import { absoluteUrl } from '@/seo/constants';
  import { readingTimeFromMarkdown } from '@/seo/readingTime';
  import { parseMarkdownWithToc, stripFrontmatter, type TocItem } from '@/blog/toc';
  import { relatedPosts } from '@/blog/related';

  const route = useRoute();
  const slug = route.params.slug as string;

  const isLoading = ref(true);
  const error = ref<string | null>(null);
  const parsedMarkdown = ref('');
  const readingTime = ref('');
  const postingJsonLd = ref<Record<string, unknown> | null>(null);
  const tocItems = ref<TocItem[]>([]);
  const activeTocId = ref('');
  const articleRef = ref<HTMLElement | null>(null);
  const readingProgress = ref(0);
  let tocObserver: IntersectionObserver | null = null;
  const READING_PROGRESS_ID = 'blog-reading-progress';

  const postMeta = computed<BlogPostMeta | undefined>(() => {
    return blogPosts.find(post => post.slug === slug);
  });

  const related = computed(() => {
    if (!postMeta.value) return [];
    return relatedPosts(postMeta.value, blogPosts);
  });

  // Registered synchronously here (unhead needs Vue's component context, which
  // is only available during setup — not after an `await` inside onMounted).
  // The onMounted handler below just writes to postingJsonLd once the word
  // count is known, and this reactively re-renders the script tag.
  useHead({
    script: computed(() =>
      postingJsonLd.value
        ? [{ type: 'application/ld+json', innerHTML: JSON.stringify(postingJsonLd.value) }]
        : [],
    ),
  });

  if (postMeta.value) {
    useSeo({
      title: `${postMeta.value.title} | Lokesh Ram Chand`,
      description: postMeta.value.excerpt,
      path: `/blog/${slug}`,
      image: postMeta.value.image ? absoluteUrl(postMeta.value.image) : undefined,
      type: 'article',
      article: {
        publishedTime: toIsoDate(postMeta.value.date),
        modifiedTime: toIsoDate(postMeta.value.date),
        tags: postMeta.value.tags,
      },
      jsonLd: [
        breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: postMeta.value.title, path: `/blog/${slug}` },
        ]),
      ],
    });
  } else {
    useSeo({
      title: 'Post Not Found | Lokesh Ram Chand',
      description: 'The blog post you are looking for could not be found.',
      path: `/blog/${slug}`,
      noindex: true,
    });
  }

  function scrollToHeading(id: string) {
    lenis.scrollTo(`#${id}`, { offset: -96, duration: 1.5 });
  }

  function setupReadingProgress() {
    ScrollTrigger.getById(READING_PROGRESS_ID)?.kill();
    if (!articleRef.value) return;

    ScrollTrigger.create({
      id: READING_PROGRESS_ID,
      trigger: articleRef.value,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        readingProgress.value = self.progress;
      },
    });
  }

  function setupTocObserver() {
    tocObserver?.disconnect();

    const headings = tocItems.value
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => !!el);

    if (headings.length === 0) return;

    activeTocId.value = tocItems.value[0].id;

    tocObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          activeTocId.value = visible[0].target.id;
        }
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    );

    headings.forEach((el) => tocObserver?.observe(el));
  }

  onUnmounted(() => {
    tocObserver?.disconnect();
    ScrollTrigger.getById(READING_PROGRESS_ID)?.kill();
  });

  // Watch for loading to finish, then animate once DOM updates
  watch(isLoading, async (newVal) => {
    if (!newVal && !error.value) {
      await nextTick();
      animateBlogPostEnter();
      setupTocObserver();
      setupReadingProgress();
    }
  });

  onMounted(async () => {
    if (!postMeta.value) {
      error.value = "Error 404: Post metadata not found.";
      isLoading.value = false;
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}blogs/${slug}.md`);
      
      if (!response.ok) {
        throw new Error("Markdown file could not be loaded.");
      }

      const text = await response.text();
      const { html, toc } = parseMarkdownWithToc(text);
      parsedMarkdown.value = html;
      tocItems.value = toc;

      const { wordCount, text: readingTimeText } = readingTimeFromMarkdown(stripFrontmatter(text));
      readingTime.value = readingTimeText;

      if (postMeta.value) {
        postingJsonLd.value = blogPostingSchema(postMeta.value, { wordCount });
      }
    } catch (err) {
      error.value = "Failed to load content. Please check the file path.";
      console.error(err);
    } finally {
      isLoading.value = false;
    }
  });
</script>