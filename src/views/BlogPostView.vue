<template>
  <section class="padding-x min-h-svh pt-[15vh] pb-32">
    <div class="w-full max-w-3xl mx-auto z-10 relative">
      
      <router-link to="/blog" class="post-back-btn inline-flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-widest text-flax-smoke-500 hover:text-flax-smoke-900 transition-colors duration-500 mb-12">
        <span>←</span> Back to Journal
      </router-link>

      <div v-if="isLoading" class="heading-4 font-mono animate-pulse text-flax-smoke-400">
        Loading data stream...
      </div>

      <div v-else-if="error" class="heading-4 font-mono text-flax-smoke-500">
        {{ error }}
      </div>

      <article v-else class="will-change-transform">
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

    </div>
  </section>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed, watch, nextTick } from 'vue';
  import { useRoute } from 'vue-router';
  import { useHead } from '@unhead/vue';
  import { marked } from 'marked';
  import { Tag } from '@/components/common';
  import { blogPosts } from '@/data';
  import { animateBlogPostEnter } from '@/animations'; // Adjust path if needed
  import { useSeo } from '@/seo/useSeo';
  import { blogPostingSchema, breadcrumbSchema, toIsoDate } from '@/seo/schema';
  import { readingTimeFromMarkdown } from '@/seo/readingTime';

  const route = useRoute();
  const slug = route.params.slug as string;

  const isLoading = ref(true);
  const error = ref<string | null>(null);
  const parsedMarkdown = ref('');
  const readingTime = ref('');

  const postMeta = computed(() => {
    return blogPosts.find(post => post.slug === slug);
  });

  if (postMeta.value) {
    useSeo({
      title: `${postMeta.value.title} | Lokesh Ram Chand`,
      description: postMeta.value.excerpt,
      path: `/blog/${slug}`,
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

  // Watch for loading to finish, then animate once DOM updates
  watch(isLoading, async (newVal) => {
    if (!newVal && !error.value) {
      await nextTick();
      animateBlogPostEnter();
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
      parsedMarkdown.value = marked.parse(text) as string;

      const { wordCount, text: readingTimeText } = readingTimeFromMarkdown(text);
      readingTime.value = readingTimeText;

      if (postMeta.value) {
        useHead({
          script: [
            {
              type: 'application/ld+json',
              innerHTML: JSON.stringify(
                blogPostingSchema(postMeta.value, { wordCount }),
              ),
            },
          ],
        });
      }
    } catch (err) {
      error.value = "Failed to load content. Please check the file path.";
      console.error(err);
    } finally {
      isLoading.value = false;
    }
  });
</script>