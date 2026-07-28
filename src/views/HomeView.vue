<template>
  <main class="relative min-h-full">
    <Hero />
    <div
      class="text-flax-smoke-200 relative rounded-t-3xl bg-[#0B0B0A] py-[5%]"
    >
      <Services />
      <Marquee />
      <Works />
    </div>

    <aboutMe />
    <People />
    <Contact />
  </main>
</template>

<script setup lang="ts">
  import {
    Hero,
    People,
    Services,
    Works,
    aboutMe,
    Contact,
  } from '@/components/sections';
  import { Marquee } from '@/components/design';
  import { nextTick, onMounted } from 'vue';
  import ScrollTrigger from 'gsap/ScrollTrigger';
  import { lenis } from '@/main';
  import { pendingSection } from '@/state';
  import { useSeo } from '@/seo/useSeo';
  import { profilePageSchema, websiteSchema } from '@/seo/schema';
  import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from '@/seo/constants';

  // The richer Person schema lives as static JSON-LD in index.html (#person)
  // so it's visible to non-JS-executing crawlers too; profilePageSchema()
  // references it by @id instead of duplicating it here.
  useSeo({
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: '/',
    jsonLd: [websiteSchema(), profilePageSchema()],
  });

  onMounted(async () => {
    if (!pendingSection.value) return;

    const target = pendingSection.value;
    pendingSection.value = null;

    await nextTick();
    ScrollTrigger.refresh();
    lenis.start();
    lenis.scrollTo(target, { duration: 3 });
  });
</script>
