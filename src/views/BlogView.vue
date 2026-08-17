<template>
  <section class="padding-x min-h-svh pt-[15vh] pb-20">
    <!-- Masthead -->
    <div class="w-full max-w-6xl mx-auto z-10 relative">
      <div class="blog-header-anim flex items-center justify-between gap-4 border-b border-flax-smoke-200 pb-3 mb-6">
        <p class="font-mono text-xs font-bold tracking-[0.2em] text-flax-smoke-400 uppercase">
          {{ dateline }}
        </p>
        <p class="font-mono text-xs font-bold tracking-[0.2em] text-flax-smoke-400 uppercase">
          Issue No. {{ blogPosts.length.toString().padStart(2, '0') }}
        </p>
      </div>

      <div class="blog-header-anim text-center border-b-4 border-flax-smoke-900 pb-8 mb-8">
        <h1 class="font-title! font-bold uppercase tracking-tighter leading-[0.85] text-flax-smoke-900 text-[clamp(2.5rem,8vw,6.5rem)]">
          The Build Log
        </h1>
        <p class="font-mono text-sm font-bold tracking-[0.3em] text-flax-smoke-500 uppercase mt-3">
          Notes on Self-Hosting &amp; Infrastructure
        </p>
      </div>

      <div class="blog-header-anim flex flex-wrap items-center justify-between gap-4 mb-16">
        <p class="heading-6 text-flax-smoke-500 font-medium text-balance max-w-lg">
          Notes on self-hosting, infrastructure, and building things that stay up.
        </p>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search dispatches..."
          aria-label="Search blog posts"
          class="w-full sm:w-72 bg-transparent border-b-2 border-flax-smoke-200 focus:border-flax-smoke-900 outline-none py-2 font-mono text-sm text-flax-smoke-900 placeholder:text-flax-smoke-400 transition-colors duration-500"
        />
      </div>
    </div>

    <!-- Featured story -->
    <div v-if="featured && matchedSlugs.has(featured.slug)" class="w-full max-w-6xl mx-auto z-10 relative mb-16">
      <router-link
        :to="`/blog/${featured.slug}`"
        class="blog-item-anim group grid gap-8 md:grid-cols-[1.1fr_1fr] items-start pb-16 border-b-4 border-flax-smoke-900"
      >
        <div
          v-if="featured.image"
          class="w-full aspect-[16/10] overflow-hidden bg-flax-smoke-100 border border-flax-smoke-200"
        >
          <img
            :src="featured.image"
            :alt="featured.title"
            class="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-[filter] duration-700"
            loading="lazy"
          />
        </div>
        <div v-else class="hidden md:block" />

        <div class="flex flex-col items-start">
          <p class="font-mono text-xs font-bold tracking-[0.2em] text-flax-smoke-500 uppercase mb-4">
            Featured &middot; {{ featured.tags[0] ?? 'Dispatch' }}
          </p>
          <h2 class="font-title! font-bold uppercase leading-[0.9] tracking-tight text-balance mb-5 text-flax-smoke-900 text-[clamp(1.8rem,4vw,3.2rem)] group-hover:text-flax-smoke-600 transition-colors duration-500">
            {{ featured.title }}
          </h2>
          <p class="heading-6 text-flax-smoke-600 text-balance font-medium mb-6">
            {{ featured.excerpt }}
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <p class="font-mono text-xs font-bold text-flax-smoke-500 uppercase">{{ featured.date }}</p>
            <span class="text-flax-smoke-300">&middot;</span>
            <Tag v-for="tag in featured.tags" :key="tag">{{ tag }}</Tag>
          </div>
        </div>
      </router-link>
    </div>

    <!-- Story grid -->
    <div class="w-full max-w-6xl mx-auto z-10 relative">
      <div class="blog-item-anim flex items-center gap-4 mb-10">
        <p class="font-mono text-xs font-bold tracking-[0.2em] text-flax-smoke-400 uppercase whitespace-nowrap">
          More Dispatches
        </p>
        <div class="h-px w-full bg-flax-smoke-200" />
      </div>

      <div class="grid gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
        <router-link
          v-for="post in rest"
          v-show="matchedSlugs.has(post.slug)"
          :key="post.slug"
          :to="`/blog/${post.slug}`"
          class="blog-item-anim group flex flex-col items-start pt-1"
        >
          <p class="font-mono text-xs font-bold tracking-[0.2em] text-flax-smoke-500 uppercase mb-3">
            {{ post.tags[0] ?? 'Dispatch' }}
          </p>
          <h3 class="heading-5 font-fancy font-bold leading-tight mb-3 text-flax-smoke-900 group-hover:text-flax-smoke-600 transition-colors duration-500">
            {{ post.title }}
          </h3>
          <p class="text-sm text-flax-smoke-500 text-balance mb-5 leading-relaxed">
            {{ post.excerpt }}
          </p>
          <p class="font-mono text-xs font-bold text-flax-smoke-400 uppercase mt-auto pt-4 border-t border-flax-smoke-100 w-full">
            {{ post.date }}
          </p>
        </router-link>
      </div>

      <p
        v-if="matchedSlugs.size === 0"
        class="font-mono text-sm text-flax-smoke-400 py-10 uppercase tracking-widest"
      >
        No dispatches match "{{ searchQuery }}".
      </p>
    </div>
  </section>
</template>
<script setup lang="ts">
  import { onMounted, nextTick, ref, computed } from 'vue';
  import { Tag } from '@/components/common';
  import { blogPosts } from '@/generated/blogIndex';

  // Make sure to import your new animation and Lenis/ScrollTrigger
  import { animateBlogListEnter } from '@/animations';
  import ScrollTrigger from 'gsap/ScrollTrigger';
  import { lenis, raf } from '@/main';
  import { useSeo } from '@/seo/useSeo';
  import { breadcrumbSchema, collectionPageSchema, type BlogPostMeta } from '@/seo/schema';

  const searchQuery = ref('');

  const featured = computed<BlogPostMeta>(() => blogPosts[0]);
  const rest = computed<BlogPostMeta[]>(() => blogPosts.slice(1));

  const dateline = computed(() =>
    new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  );

  const matchedSlugs = computed<Set<string>>(() => {
    const query = searchQuery.value.trim().toLowerCase();
    if (!query) return new Set(blogPosts.map((post) => post.slug));

    return new Set(
      blogPosts
        .filter((post) => {
          const haystack = [post.title, post.excerpt, ...post.tags].join(' ').toLowerCase();
          return haystack.includes(query);
        })
        .map((post) => post.slug),
    );
  });

  useSeo({
    title: 'Blog | Lokesh Ram Chand',
    description:
      'Engineering notes on self-hosting, infrastructure, and building scalable full-stack systems, written by Lokesh Ram Chand B.',
    path: '/blog',
    jsonLd: [
      collectionPageSchema(),
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
      ]),
    ],
  });

  onMounted(async () => {
    // 1. REMOVE the lock class that might be left over from HomeView
    document.body.classList.remove('stop-scrolling');

    // 2. Ensure Lenis is actually running
    requestAnimationFrame(raf);
    lenis.start();

    // 3. Wait for Vue to fully render the list in the DOM
    await nextTick();

    // 4. Force GSAP to map the new page height
    ScrollTrigger.refresh();

    // 5. Fire the dedicated entrance animation
    animateBlogListEnter();
  });
</script>
