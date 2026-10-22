<template>
  <section class="padding-x relative h-svh overflow-hidden py-3 sm:py-5">
    <ShaderBackground class="inset-0" />

    <div
      class="relative z-10 mx-auto grid h-full w-full max-w-7xl grid-cols-2 grid-rows-[auto_minmax(0,1fr)_auto_auto_auto] gap-2 sm:gap-3 lg:grid-cols-4 lg:grid-rows-3 lg:gap-4"
    >
      <!-- Name + tagline -->
      <div
        class="intro-anim bento col-span-2 flex flex-col justify-between gap-3 lg:row-span-2"
      >
        <p class="bento-label">[ Hi there ]</p>
        <div class="flex flex-col gap-3 lg:gap-6">
          <h1
            class="font-fancy text-flax-smoke-900 text-[clamp(2rem,min(6vw,8svh),5.5rem)] leading-[0.95] font-bold tracking-tight uppercase"
          >
            I'm Lokesh Ram Chand.
          </h1>
          <p
            class="text-flax-smoke-700 line-clamp-3 max-w-[55ch] text-sm leading-snug font-medium text-balance sm:text-base lg:line-clamp-4 2xl:text-lg"
          >
            {{ heroText }}
          </p>
        </div>
      </div>

      <!-- Photo -->
      <div class="intro-anim bento relative p-0! lg:row-span-2">
        <img
          :src="profile"
          alt="Portrait of Lokesh Ram Chand"
          class="absolute inset-0 size-full object-cover grayscale transition duration-700 hover:grayscale-0"
        />
      </div>

      <!-- Location + local time -->
      <div class="intro-anim bento flex flex-col justify-between gap-2">
        <p class="bento-label">Based in</p>
        <div>
          <p
            class="font-title! text-flax-smoke-900 text-lg font-bold sm:text-2xl"
          >
            {{ locationCountry }}
          </p>
          <p
            class="text-flax-smoke-500 font-mono text-[10px] tracking-widest sm:text-xs"
          >
            {{ locationPlace }}
          </p>
          <p class="text-flax-smoke-700 mt-1 font-mono text-xs sm:text-sm">
            {{ localTime }} IST
          </p>
        </div>
      </div>

      <!-- Links (moved after work below lg) -->
      <div
        class="intro-anim bento flex flex-col justify-between gap-2 max-lg:order-1"
      >
        <p class="bento-label">Elsewhere</p>
        <ul
          class="flex flex-col gap-1 font-mono text-xs font-bold tracking-widest uppercase sm:text-sm"
        >
          <li v-for="link in links" :key="link.label">
            <a
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-flax-smoke-900 hover:text-flax-smoke-500 transition-colors"
            >
              {{ link.label }} ↗
            </a>
          </li>
        </ul>
      </div>

      <!-- Focus areas -->
      <div
        class="intro-anim bento col-span-2 flex flex-col justify-between gap-2"
      >
        <p class="bento-label">Focus</p>
        <ul
          class="text-flax-smoke-700 flex flex-col gap-1 font-mono text-xs sm:text-sm"
        >
          <li v-for="point in bioPoints" :key="point.title">
            <span class="text-flax-smoke-500">*</span>
            <strong class="text-flax-smoke-900 font-bold">{{
              point.title
            }}</strong>
            <span class="max-xl:hidden"> — {{ point.body }}</span>
          </li>
        </ul>
      </div>

      <!-- Selected work -->
      <div
        class="intro-anim bento col-span-2 flex flex-col justify-between gap-2 lg:col-span-1"
      >
        <p class="bento-label">Selected work</p>
        <ul class="divide-flax-smoke-200 flex flex-col divide-y">
          <li v-for="work in selectedWork" :key="work.name">
            <a
              :href="work.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-baseline justify-between gap-3 py-1.5"
            >
              <span
                class="font-title! text-flax-smoke-900 group-hover:text-flax-smoke-500 text-lg font-bold uppercase transition-colors sm:text-xl"
              >
                {{ work.name }}
              </span>
              <span
                class="text-flax-smoke-700 font-mono text-[10px] tracking-widest uppercase"
              >
                {{ work.year }}
              </span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Enter site -->
      <router-link
        to="/"
        class="intro-anim bento group flex flex-col justify-between gap-2 max-lg:order-1"
      >
        <p class="bento-label">Portfolio</p>
        <p
          class="font-title! text-flax-smoke-900 group-hover:text-flax-smoke-500 flex items-center justify-between text-xl font-bold uppercase transition-colors sm:text-3xl"
        >
          Enter
          <span
            class="transition-transform duration-500 group-hover:translate-x-2"
            >→</span
          >
        </p>
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed, onMounted, nextTick } from 'vue';
  import ScrollTrigger from 'gsap/ScrollTrigger';
  import { lenis, raf } from '@/main';
  import { useNow } from '@vueuse/core';
  import {
    heroText,
    locationCountry,
    locationPlace,
    socialLinks,
    resourceLinks,
  } from '@/data';
  import { profile } from '@/assets/images';
  import { ShaderBackground } from '@/components/design';
  import { animateIntroEnter } from '@/animations';
  import { appBooted } from '@/state';
  import { useSeo } from '@/seo/useSeo';
  import { personSchema } from '@/seo/schema';

  useSeo({
    title: 'Lokesh Ram Chand | Software Engineer',
    description: heroText,
    path: '/intro',
    jsonLd: [personSchema()],
  });

  const bioPoints = [
    {
      title: 'AI & Machine Learning',
      body: 'building intelligent applications that actually ship, not just research.',
    },
    {
      title: 'Full-Stack Engineering',
      body: 'React/Next.js, Flutter, and clean component architecture end to end.',
    },
    {
      title: 'Backend & Infrastructure',
      body: 'distributed systems, cloud infra, and data pipelines that hold up.',
    },
  ];

  // ponytail: duplicated from Works.vue's selectedWorksProps (that list also carries video imports); move both to data.ts if it grows.
  const selectedWork = [
    {
      name: 'Velar',
      category: 'AI Finance System',
      year: '2024',
      url: 'https://github.com/lokeshramchand-ctrl/Velar',
    },
    {
      name: 'MapLayer',
      category: 'GeoRAG Platform',
      year: '2025',
      url: 'https://github.com/lokeshramchand-ctrl/MapLayer',
    },
  ];

  // GitHub appears in both lists.
  const links = [
    ...socialLinks,
    ...resourceLinks.filter((l) => l.label !== 'GitHub'),
  ];

  const now = useNow({ interval: 30_000 });
  const localTime = computed(() =>
    now.value.toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
    }),
  );

  onMounted(async () => {
    document.body.classList.remove('stop-scrolling');
    requestAnimationFrame(raf);
    lenis.start();

    // This route skips the boot loading curtain, so nothing else ever
    // sets appBooted — do it here so Hero reveals immediately if the
    // user clicks through to Home afterwards (see Hero.vue onMounted).
    appBooted.value = true;

    await nextTick();
    ScrollTrigger.refresh();
    animateIntroEnter();
  });
</script>

<style scoped>
  @reference '../style.css';

  .bento {
    @apply border-flax-smoke-200 bg-flax-smoke-100 bg-flax-smoke-100/60! min-h-0 overflow-hidden rounded-2xl border p-4 opacity-0 backdrop-blur-md sm:rounded-3xl sm:p-6;
  }

  .bento-label {
    @apply text-flax-smoke-400 font-mono text-[10px] font-bold tracking-[0.2em] uppercase opacity-60 sm:text-xs;
  }
</style>
