<template>
  <div id="slider" class="relative mt-12 w-full lg:mt-[10%]">
    <div
      class="border-flax-smoke-300 grid grid-cols-12 items-center border-t pt-6"
    >
      <div class="col-span-6 overflow-hidden lg:col-span-3">
        <span
          id="current-index"
          class="heading-6 text-flax-smoke-500/85 inline-block text-nowrap uppercase"
        >
          ( {{ pad(index + 1) }}<span v-if="people.length > 1">
            / {{ pad(people.length) }}</span
          >
          )
        </span>
      </div>

      <div
        v-if="people.length > 1"
        role="group"
        aria-label="Testimonial navigation"
        class="col-span-6 flex items-center justify-end gap-6 lg:col-span-9"
      >
        <button
          type="button"
          class="text-flax-smoke-400 hover:text-flax-smoke-900 text-sm uppercase tracking-wide transition-colors"
          @click="clickPrev"
        >
          Prev
        </button>
        <button
          type="button"
          class="text-flax-smoke-400 hover:text-flax-smoke-900 text-sm uppercase tracking-wide transition-colors"
          @click="clickNext"
        >
          Next
        </button>
      </div>
    </div>

    <div class="mt-10 grid grid-cols-12 lg:mt-14">
      <div
        class="relative col-span-full overflow-hidden lg:col-span-9 lg:col-start-4"
      >
        <blockquote
          id="quote-text"
          class="heading-3 max-w-[34ch] leading-snug font-semibold"
          v-html="computedQuote"
        ></blockquote>

        <div
          id="quote-author"
          class="mt-10 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4"
        >
          <cite class="font-title heading-5 text-flax-smoke-900 text-nowrap font-bold not-italic uppercase">
            {{ people[index].author }}
          </cite>
          <span class="text-flax-smoke-400 text-nowrap">{{ people[index].position }}</span>
        </div>

        <div id="quote-overlay" class="bg-flax-smoke-500 absolute inset-0"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { textSplitterIntoChar } from '@/functions';
  import gsap from 'gsap';

  const pad = (n: number) => n.toString().padStart(2, '0');

  const computedQuote = computed(() => {
    return textSplitterIntoChar(`" ${people[index.value].quote} "`);
  });

  const canClick = ref(true);

  const animateTextTransition = (direction: 'up' | 'zero') => {
    const translateY = direction === 'up' ? '-100%' : '0%';
    gsap.to('#quote-text .letters', {
      translateY,
      duration: 0.5,
      stagger: 0.001,
      ease: 'power1.inOut',
    });
  };

  const animateQuoteAuthorTransition = (
    direction: 'left' | 'right',
    onCompleteFunc?: () => void,
  ) => {
    const translateX = direction === 'left' ? '-50%' : '0%';
    const opacity = direction === 'left' ? 0 : 1;
    gsap.to('#quote-author', {
      translateX,
      opacity,
      duration: 0.5,
      ease: 'power1.inOut',
      onComplete: () => {
        if (onCompleteFunc) onCompleteFunc();
      },
    });
  };

  const animateCurrentQuoteIndex = (
    direction: 'up' | 'zero',
    onCompleteFunc?: () => void,
  ) => {
    const translateY = direction === 'up' ? '-100%' : '0%';
    gsap.to(['#current-index'], {
      translateY,
      duration: 0.5,
      ease: 'power1.inOut',
      onComplete: () => {
        if (onCompleteFunc) onCompleteFunc();
      },
    });
  };

  const animateQuoteOverlay = (
    newIndex: number,
    onCompleteFunc?: () => void,
  ) => {
    gsap.to('#quote-overlay', {
      translateY: '0%',
      duration: 0.7,
      ease: 'power4.inOut',
      onComplete: () => {
        index.value = newIndex;
        if (onCompleteFunc) onCompleteFunc();

        gsap.to('#quote-overlay', {
          translateY: '-100%',
          duration: 0.7,
          ease: 'power4.inOut',
          onComplete: () => {
            gsap.set('#quote-overlay', { translateY: '100%' });
            canClick.value = true;
          },
        });
      },
    });
  };

  // Function to trigger the quote change
  const changeQuote = (newIndex: number) => {
    animateTextTransition('up');
    animateQuoteAuthorTransition('left');
    animateQuoteOverlay(newIndex, () => {
      setTimeout(() => {
        animateTextTransition('zero');
      }, 25);
      animateCurrentQuoteIndex('zero');
      animateQuoteAuthorTransition('right');
    });
    animateCurrentQuoteIndex('up', () => {
      gsap.set(['#current-index'], {
        y: '100%',
      });
    });
  };

  // Event handlers for next and previous clicks
  const clickNext = () => {
    if (!canClick.value) return;

    canClick.value = false;
    let newIndex = (index.value + 1) % people.length;
    if (newIndex < people.length) changeQuote(newIndex);
  };

  const clickPrev = () => {
    if (!canClick.value) return;

    canClick.value = false;
    const newIndex = (index.value - 1 + people.length) % people.length;
    changeQuote(newIndex);
  };

  onMounted(() => {
    gsap.set(['#quote-text .letters', '#current-index'], {
      translateY: 0,
    });
    gsap.set('#quote-overlay', {
      translateY: '100%',
    });
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
