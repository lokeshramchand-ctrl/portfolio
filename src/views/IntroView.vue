<template>
  <section
    class="padding-x flex min-h-svh flex-col justify-center gap-10 py-32 sm:py-40"
  >
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <p
        class="intro-anim font-mono text-sm font-bold tracking-[0.2em] text-flax-smoke-400 uppercase opacity-0"
      >
        [ Hi there ]
      </p>

      <h1
        class="intro-anim heading-1-alt font-fancy leading-[0.95] font-bold tracking-tight text-flax-smoke-900 uppercase opacity-0"
      >
        I'm Lokesh Ram Chand.
      </h1>

      <p
        class="intro-anim font-mono text-sm tracking-widest text-flax-smoke-500 uppercase opacity-0"
      >
        {{ locationCountry }} — {{ locationPlace }}
      </p>

      <p
        class="intro-anim heading-6 max-w-[55ch] text-balance leading-snug font-medium text-flax-smoke-700 opacity-0"
      >
        {{ heroText }}
      </p>

      <div class="intro-anim w-full border-t-2 border-flax-smoke-200 opacity-0"></div>

      <ul class="flex flex-col gap-4 font-mono text-sm text-flax-smoke-600 sm:text-base">
        <li v-for="point in bioPoints" :key="point.title" class="intro-anim opacity-0">
          <span class="text-flax-smoke-500">*</span>
          <strong class="font-bold text-flax-smoke-900">{{ point.title }}</strong>
          — {{ point.body }}
        </li>
      </ul>

      <router-link
        to="/"
        class="intro-anim group inline-flex w-fit items-center gap-3 self-start rounded-full border-2 border-flax-smoke-800 px-6 py-3 font-mono text-sm font-bold tracking-[0.15em] text-flax-smoke-900 uppercase opacity-0 transition-colors duration-500 hover:bg-flax-smoke-900 hover:text-flax-smoke-50"
      >
        Read more
        <span class="transition-transform duration-500 group-hover:translate-x-1">→</span>
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { onMounted, nextTick } from 'vue';
  import ScrollTrigger from 'gsap/ScrollTrigger';
  import { lenis, raf } from '@/main';
  import { heroText, locationCountry, locationPlace } from '@/data';
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
