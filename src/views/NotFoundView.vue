<template>
  <section class="padding-x flex-center min-h-svh flex-col text-center">
    <p class="heading-6 font-mono font-bold tracking-[0.2em] text-flax-smoke-400 uppercase mb-4">
      [ Error 404 ]
    </p>
    <h1 class="heading-display font-fancy font-bold leading-[0.85] tracking-tighter uppercase text-flax-smoke-900 mb-6">
      Page Not <br /> <span class="text-flax-smoke-400">Found.</span>
    </h1>
    <p class="heading-6 max-w-[45ch] text-flax-smoke-600 text-balance font-medium mb-10">
      The page you're looking for doesn't exist or has moved.
    </p>
    <router-link
      to="/"
      class="inline-flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-widest text-flax-smoke-500 hover:text-flax-smoke-900 transition-colors duration-500"
    >
      <span>←</span> Back to Home
    </router-link>
  </section>
</template>

<script setup lang="ts">
  import { onMounted } from 'vue';
  import { useSeo } from '@/seo/useSeo';
  import { lenis, raf } from '@/main';

  useSeo({
    title: 'Page Not Found | Lokesh Ram Chand',
    description: 'The page you are looking for does not exist or has moved.',
    path: '/404',
    noindex: true,
  });

  onMounted(() => {
    document.body.classList.remove('stop-scrolling');
    requestAnimationFrame(raf);
    lenis.start();
  });
</script>
