<template>
  <section class="padding-x mb-[-100svh] py-0 relative overflow-hidden">
    <div
      id="hero"
      class="sticky top-0 flex min-h-[100svh] w-full flex-col justify-center pt-28 pb-20 sm:pt-[15vh] sm:pb-[5vh]"
    >
      <div class="w-full z-10 flex flex-col relative">
        <h1 class="heading-display font-fancy font-bold leading-[0.9] sm:leading-[0.85] tracking-tighter text-flax-smoke-900 uppercase break-words">
          <span class="block">Software</span>
          
          <span class="relative inline-block w-fit pr-10 sm:pr-14 lg:pr-20 text-flax-smoke-400">
            Engineered Well.
            <Star 
              id="star" 
              class="absolute top-0 right-0 -translate-y-[20%] sm:-translate-y-1/3 size-8 sm:size-12 lg:size-16 text-flax-smoke-500 will-change-transform" 
            />
          </span>
        </h1>
      </div>

      <div class="w-full z-10 mt-6 sm:mt-10 lg:mt-12 border-t-2 border-flax-smoke-200 pt-4 sm:pt-6 flex flex-col md:flex-row items-start justify-between gap-8 md:gap-12 lg:gap-20">
        
        <div class="flex flex-col overflow-hidden w-full md:flex-1">
          <p
            v-html="whoAmI"
            id="whoAmI"
            class="who-am-i heading-5 w-full max-w-[100%] md:max-w-[50ch] text-balance font-medium leading-snug text-flax-smoke-700"
          ></p>
        </div>

        <div class="relative origin-left overflow-hidden shrink-0">
          <div id="contact-btn" class="flex -translate-y-full will-change-transform">
            <Button label="Get in touch" url="https://wa.me/919121661507" />
          </div>
        </div>

      </div>

      <div class="absolute bottom-6 sm:bottom-8 left-[3%] overflow-hidden flex items-center gap-3 sm:gap-4">
        <svg
          id="down-arrow"
          stroke="currentColor"
          fill="none"
          stroke-width="1.5"
          viewBox="6 6 12 12"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="m-0 size-5 sm:size-6 -translate-y-full p-0 text-flax-smoke-500 will-change-transform"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="12" y1="6" x2="12" y2="18"></line>
          <polyline points="7 13 12 18 17 13"></polyline>
        </svg>
      </div>
    </div>
    
    <div class="h-svh"></div>
  </section>
</template>

<script setup lang="ts">
  import { onBeforeMount, onMounted, ref } from 'vue';
  import { Star } from '../design';
  import { Button } from '@/components/common';
  import { textSplitterIntoChar } from '@/functions';
  import {
    animateHeroEntrance,
    animateHeroScrollPin,
    navbarScale,
  } from '@/animations';
  import { useAnimationScope } from '@/animations/lifecycle';
  import { appBooted } from '@/state';

  const { run } = useAnimationScope('hero');

  const whoAmI = ref(
    'I’m a software engineer passionate about building scalable applications, intelligent systems, and digital experiences that solve real-world problems. From full-stack development to AI-powered products, I enjoy transforming ambitious ideas into reliable, production-ready software.'
  );

  onBeforeMount(() => {
    whoAmI.value = textSplitterIntoChar(whoAmI.value);
  });

  onMounted(() => {
    // Scoped to 'hero' so both ScrollTriggers are killed together the
    // moment this component unmounts, on top of the manual
    // ScrollTrigger.getById(...).kill() guard each still carries.
    run(() => {
      animateHeroScrollPin();
      navbarScale('#burger', '#hero');
    });

    // True first mount (app boot): the loading curtain reveals Hero
    // once it finishes. Any later mount (returning to Home via SPA
    // navigation) has no curtain to wait for, so reveal immediately.
    if (appBooted.value) {
      animateHeroEntrance(0, 0);
    }
  });
</script>