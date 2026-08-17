<template>
  <section class="padding-x min-h-svh pt-[15vh] pb-20">
    <div class="w-full max-w-5xl mx-auto mb-20 z-10 relative">
      <p class="blog-header-anim heading-6 font-mono font-bold tracking-[0.2em] text-flax-smoke-400 uppercase mb-4">
        [ Engineering Journal ]
      </p>
      <h1 class="blog-header-anim heading-display font-fancy font-bold leading-[0.85] tracking-tighter uppercase text-flax-smoke-900">
        Writing & <br/> <span class="text-flax-smoke-400">Thinking.</span>
      </h1>
    </div>

    <div class="w-full max-w-5xl mx-auto mb-12 z-10 relative">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search posts by title, tag, or excerpt..."
        aria-label="Search blog posts"
        class="w-full bg-transparent border-b-2 border-flax-smoke-200 focus:border-flax-smoke-900 outline-none py-3 font-mono text-sm text-flax-smoke-900 placeholder:text-flax-smoke-400 transition-colors duration-500"
      />
    </div>

    <div class="blog-list-container w-full max-w-5xl mx-auto flex flex-col border-t-2 border-flax-smoke-200 z-10 relative">
      <router-link
        v-for="post in blogPosts"
        v-show="matchedSlugs.has(post.slug)"
        :key="post.slug"
        :to="`/blog/${post.slug}`"
        class="blog-item-anim group flex flex-col md:flex-row justify-between items-start md:items-center py-10 border-b-2 border-flax-smoke-100 hover:border-flax-smoke-900 transition-colors duration-500"
      >
        <div class="flex flex-col gap-4 md:w-1/3 mb-6 md:mb-0 pr-4">
          <p class="font-mono text-sm font-bold text-flax-smoke-500 uppercase">{{ post.date }}</p>
          <div class="flex flex-wrap gap-2">
            <Tag v-for="tag in post.tags" :key="tag">{{ tag }}</Tag>
          </div>
        </div>

        <div class="md:w-2/3 flex flex-col items-start">
          <h2 class="heading-3 font-fancy font-bold leading-tight mb-4 group-hover:translate-x-4 transition-transform duration-500 text-flax-smoke-900">
            {{ post.title }}
          </h2>
          <p class="heading-6 text-flax-smoke-600 text-balance font-medium">
            {{ post.excerpt }}
          </p>
        </div>
      </router-link>

      <p
        v-if="matchedSlugs.size === 0"
        class="font-mono text-sm text-flax-smoke-400 py-10 uppercase tracking-widest"
      >
        No posts match "{{ searchQuery }}".
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
  import { breadcrumbSchema, collectionPageSchema } from '@/seo/schema';

  const searchQuery = ref('');

  const matchedSlugs = computed(() => {
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