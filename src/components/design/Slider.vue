<template>
  <div id="slider" class="relative mt-12 w-full lg:mt-16">
    <div class="grid w-full grid-cols-12 items-end">
      <span
        class="heading-6 text-flax-smoke-500/85 col-span-full inline-block text-nowrap uppercase lg:col-span-3"
      >
        ( {{ pad(index + 1) }} )
      </span>
    </div>

    <div class="mt-10 grid grid-cols-12 lg:mt-14">
      <div
        class="relative col-span-full overflow-hidden lg:col-span-9 lg:col-start-4"
      >
        <svg
          id="quote-mark"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="text-flax-smoke-500 pointer-events-none absolute -top-4 -left-2 size-24 opacity-0 sm:size-36 lg:-top-6 lg:size-44"
        >
          <path
            d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-4v-10h10z"
          />
        </svg>

        <blockquote
          id="quote-text"
          class="heading-3 relative z-10 max-w-[34ch] leading-snug font-semibold"
          v-html="computedQuote"
        ></blockquote>

        <div
          id="quote-author"
          class="border-flax-smoke-300 relative z-10 mt-12 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t pt-6 opacity-0"
        >
          <cite class="heading-5 text-flax-smoke-900 font-title font-semibold not-italic">
            {{ people[index].author }}
          </cite>
          <span class="text-flax-smoke-500 heading-6 font-mono uppercase">
            — {{ people[index].position }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { textSplitterIntoChar } from '@/functions';
  import { animateSplitText, fadeIn } from '@/animations';

  const pad = (n: number) => n.toString().padStart(2, '0');

  const computedQuote = computed(() => {
    return textSplitterIntoChar(people[index.value].quote);
  });

  onMounted(() => {
    fadeIn('#quote-mark', 0.08, 1.2);
    animateSplitText('#quote-text .letters', '#quote-author', 0.7, 0, 0);
  });

  // data
  const index = ref(0);

  const people = [
    {
      quote:
        'Lokesh was competent, open to direction, and gave expert advice throughout the redesign process. His positive attitude and humility make him a true joy to collaborate with. ',
      author: 'Danielle Lindamood',
      position: 'Director at Wellington Water Watchers',
    },
  ];
</script>
