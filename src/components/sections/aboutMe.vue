<template>
  <section
    id="about-me-section"
    class="common-padding text-flax-smoke-800 relative z-10 overflow-y-clip rounded-b-3xl bg-[#0B0B0A] shadow-2xl will-change-auto sm:mt-0"
  >
    <div class="md:column-gap grid grid-cols-12">
      <div class="hide-on-mobile overflow-hidden md:col-span-4">
        <svg
          id="down-arrow-2"
          stroke="currentColor"
          fill="none"
          stroke-width="1.25"
          viewBox="6 6 12 12"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="hide-on-mobile m-0 size-20 -translate-x-full p-0"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="7" y1="7" x2="17" y2="17"></line>
          <polyline points="17 7 17 17 7 17"></polyline>
        </svg>
      </div>

      <h3
        id="little-bit-about-me"
        v-html="aboutMe"
        class="heading-1-alt lg:heading-1 section-heading col-span-full leading-none font-extrabold uppercase md:col-span-8 md:col-start-6"
      ></h3>
    </div>

    <div class="padding-y md:column-gap mt-6 grid grid-cols-12">
      <div
        class="pointer-events-none col-span-full content-end rounded-lg select-none md:col-span-4"
      >
        <img
          :src="profile2"
          class="aspect-[1/1.5] rounded-lg object-cover object-top mix-blend-screen brightness-90 grayscale"
          alt="Headshot of Lokesh Ram Chand B facing a camera"
          loading="lazy"
        />
      </div>
      <div class="col-span-11 mt-10 md:col-span-8 md:col-start-6">
        <p
          class="heading-4 relative w-full max-w-[40ch] leading-snug font-medium text-balance"
        >
  I enjoy building software that solves meaningful problems. From intelligent AI-powered systems to scalable web applications, I focus on creating products that are reliable, intuitive, and designed to make complex workflows feel simple.
        </p>

        <div
          class="text-flax-smoke-800 mt-[5%] flex justify-start gap-10 sm:gap-20"
        >
          <p class="heading-6 text-flax-smoke-500/85 text-center text-nowrap">
            ( ABOUT ME )
          </p>
          <p class="heading-6 font-fancy w-full text-balance sm:max-w-[40ch]">
              I'm a software engineer passionate about turning ideas into products that people can actually use. My work spans full-stack development, backend systems, artificial intelligence, and modern web technologies, allowing me to design solutions from concept to deployment.<br /><br />
  I enjoy working on challenging problems that involve scalability, automation, data processing, and intelligent decision-making. Whether it's building event-driven architectures, integrating machine learning into real-world applications, or developing interactive user experiences, I strive to write clean, maintainable software that creates lasting value.
  <br /><br />
  Beyond coding, I'm constantly exploring emerging technologies, experimenting with new frameworks, and learning how modern AI systems can enhance the way people interact with software. I believe great engineering is a balance of technical excellence, thoughtful design, and continuous curiosity.

          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import {
    animateSplitText,
    xToZero,
    animateAboutMeSectionLeave,
  } from '@/animations';
  import { profile2 } from '@/assets/images';
  import { textSplitterIntoChar } from '@/functions';
  import { onBeforeMount, onMounted, ref } from 'vue';

  const aboutMe = ref('ٍSelected Projects /');

  // const initialPath = ref(`M0 0H${width.value}  V${height.value} H0 Z`);
  // const targetPath = ref(
  //   `M0 0H${width.value}L${width.value * 0.9} ${height.value}H${width.value * 0.1}L0 0Z`,
  // );

  onBeforeMount(() => {
    aboutMe.value = textSplitterIntoChar(
      'Software Engineer',
      true,
      true,
    );
  });

  onMounted(() => {
    animateSplitText(
      '#little-bit-about-me .letters',
      '#little-bit-about-me',
      1,
      0.01,
      0,
      () => {
        xToZero('#down-arrow-2');
      },
    );

    animateAboutMeSectionLeave('#about-me-section');
  });
</script>