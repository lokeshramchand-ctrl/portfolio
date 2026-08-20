<template>
  <footer
    class="relative flex flex-col items-center justify-center gap-20 p-[2%]"
  >
    <div class="grid w-full grid-cols-2 text-base sm:gap-x-6 md:grid-cols-12">
      <div
        v-for="section in footerSections"
        :key="section.title"
        class="flex flex-col md:col-span-3"
        :class="{ 'md:col-span-6': section.title === 'Menu' }"
      >
        <p
          class="heading-5 border-flax-smoke-400 w-full border-b pb-2 font-bold"
        >
          {{ section.title }}
        </p>
        <div class="mt-2 space-y-1">
          <p v-for="link in section.links" :key="link.label" class="heading-6">
            <Link
              class="font-medium tracking-wider lowercase"
              :label="link.label"
              :url="link.url"
            />
          </p>
        </div>
      </div>
    </div>

    <div class="grid w-full grid-cols-12">
      <div class="col-span-7 place-content-center md:col-span-6">
        <h6 class="heading-4 sm:heading-2 leading-none font-bold">
          © {{ new Date().getFullYear() }} Lokesh Ram Chand <br />
          All rights reserved.
        </h6>
      </div>

      <div
        class="col-span-5 place-content-center max-sm:place-content-end md:col-span-3"
      >
        <p class="heading-6 font-bold uppercase">Lokesh's Local time</p>
        <p class="heading-6">{{ myLocalTime }}</p>
        <p class="heading-6 font-bold uppercase">Your Local time</p>
        <p class="heading-6">{{ userLocalTime }}</p>
      </div>

      <div
        class="hidden md:col-span-2 md:col-start-11 md:block lg:col-span-1 lg:col-start-12"
      >
        <MagneticEffect divId="scroll-to-top" textId="scroll-to-top-icon">
          <div
            @click="lenis.scrollTo('#app', { duration: 2 })"
            id="scroll-to-top"
            class="flex-center bg-flax-smoke-400 size-20 cursor-pointer flex-col rounded-full"
          >
            <svg
              class="size-1/2"
              id="scroll-to-top-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              color="#000000"
              fill="none"
            >
              <path
                d="M12 4L12 20"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M16.9998 8.99996C16.9998 8.99996 13.3174 4.00001 11.9998 4C10.6822 3.99999 6.99982 9 6.99982 9"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </MagneticEffect>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
  import { navbarLinks, resourceLinks, socialLinks } from '@/data';
  import { Link } from '..';
  import { onMounted, ref } from 'vue';
  import { lenis } from '@/main';
  import MagneticEffect from '../MagneticEffect.vue';

  // Combine footer sections dynamically
  const footerSections = [
    { title: 'Menu', links: navbarLinks },
    { title: 'Socials', links: socialLinks },
    { title: 'Resources', links: resourceLinks },
  ];

  const myLocalTime = ref('');
  const userLocalTime = ref('');

  const formatTime = (timeZone: string) =>
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
      .format(new Date())
      .toLowerCase();

  onMounted(() => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const updateClocks = () => {
      myLocalTime.value = formatTime('Asia/Kolkata');
      userLocalTime.value = formatTime(userTimeZone);
    };

    updateClocks();
    setInterval(updateClocks, 1000);
  });
</script>