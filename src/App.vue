<template>
  <LoadingScreen v-if="showLoadingCurtain" v-cloak="true" />

  <template v-if="isSamsungBrowser">
    <SamsungError />
  </template>

  <div class="pointer-events-none fixed inset-0 z-50">
    <svg
      class="h-[150vh] w-full object-cover object-center"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="noise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.65"
          numOctaves="1"
          stitchTiles="stitch"
        />
        <feBlend mode="screen" />
      </filter>
      <rect ref="noise" class="size-full" filter="url(#noise)" opacity="0.15" />
      <filter id="noise">
        <feTurbulence
          type="fractalNoise"
          base-frequency="0.8"
          numOctaves="1"
          stitchTiles="stitch"
        />
        <feBlend mode="screen" />
      </filter>
      <rect
        ref="noise"
        class="size-full"
        filter="url(#noise)"
        opacity="-0.88"
      />
    </svg>
  </div>

  <Cursor />
  <Navbar @isLocked="LockeScroll" />

  <router-view />

  <Footer />
</template>

<script setup lang="ts">
  import { onMounted, type Ref, ref, watch } from 'vue';
  import {
    LoadingScreen,
    SamsungError,
    Footer,
    Cursor,
  } from '@/components/design';
  import { Navbar } from '@/components/common';
  import { useWindowSize } from '@vueuse/core';
  import { lenis, raf } from './main';

  const { width, height } = useWindowSize();
  const noise: Ref<HTMLElement | null> = ref(null);

  // /intro is a bare bio page meant to be seen instantly, with none of
  // the once-per-load boot curtain the rest of the site plays — it
  // self-manages the scroll-lock/raf handoff below instead (see its
  // own onMounted), mirroring how BlogView/NotFoundView already do.
  // Read straight from the URL rather than vue-router's reactive route:
  // this component mounts before the router's initial (async) navigation
  // resolves, so `useRoute().path` would still read the default '/' here.
  const showLoadingCurtain = ref(window.location.pathname !== '/intro');

  const isSamsungBrowser = /samsung/i.test(navigator.userAgent);

  const LockeScroll = (isLocked: boolean) => {
    if (isLocked) {
      lenis.stop();
    } else {
      lenis.start();
    }
  };

  watch([width, height], () => {
    if (noise.value) {
      noise.value.style.height = `${height.value * 2}px`;
      noise.value.style.width = `${width.value}px`;
    }
  });

  onMounted(() => {
    if (!showLoadingCurtain.value) return;

    document.body.classList.add('stop-scrolling');
    setTimeout(() => {
      requestAnimationFrame(raf);
    }, 2000);
  });
</script>

<style>
  .stop-scrolling #app {
    max-height: 100svh !important;
    overflow: hidden !important;
  }
</style>