<template>
  <slot />
</template>

<script setup lang="ts">
  import { useWindowSize } from '@vueuse/core';
  import { onMounted, onUnmounted } from 'vue';
  import { createMagneto } from '@/animations';

  const props = defineProps({
    divId: {
      type: String,
      required: true,
    },
    textId: {
      type: String,
      required: true,
    },
    magnetoStrengthVal: {
      type: Number,
      default: 70,
    },
    magnetoTextStrengthVal: {
      type: Number,
      default: 50,
    },
  });

  const { width } = useWindowSize();
  let magneto: HTMLElement | null = null;
  let magnetoEffect: ReturnType<typeof createMagneto> | null = null;

  const handleMouseMove = (e: MouseEvent) => magnetoEffect?.move(e);
  const handleMouseLeave = () => magnetoEffect?.reset();

  onMounted(() => {
    magneto = document.getElementById(props.divId);
    const magnetoText = document.getElementById(props.textId);
    if (!magneto || !magnetoText || width.value <= 700) return;

    magnetoEffect = createMagneto(
      magneto,
      magnetoText,
      props.magnetoStrengthVal,
      props.magnetoTextStrengthVal,
    );
    magneto.addEventListener('mousemove', handleMouseMove);
    magneto.addEventListener('mouseleave', handleMouseLeave);
  });

  onUnmounted(() => {
    magneto?.removeEventListener('mousemove', handleMouseMove);
    magneto?.removeEventListener('mouseleave', handleMouseLeave);
  });
</script>
