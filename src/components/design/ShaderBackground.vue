<template>
  <div class="pointer-events-none absolute overflow-hidden" aria-hidden="true">
    <!-- CSS stand-in: shown until the first GPU frame, and permanently
         when WebGL is unavailable or fails to compile. -->
    <div
      class="absolute inset-0 transition-opacity duration-[1500ms]"
      :class="ready ? 'opacity-0' : 'opacity-100'"
      style="
        background: radial-gradient(
          60% 55% at 78% 72%,
          rgb(217 119 6 / 0.22),
          transparent 70%
        );
      "
    ></div>
    <canvas
      ref="canvas"
      data-shader="ember"
      class="absolute inset-0 size-full transition-opacity duration-[1500ms]"
      :class="ready ? 'opacity-100' : 'opacity-0'"
    ></canvas>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue';
  import { createShaderRenderer, type ShaderRenderer } from '@/webgl';
  import { emberFragment, fullscreenVertex } from '@/webgl/shaders';

  const canvas = ref<HTMLCanvasElement | null>(null);
  const ready = ref(false);
  let renderer: ShaderRenderer | null = null;

  // Track the pointer on window (the canvas is pointer-events-none so it
  // never blocks the hero's links/buttons).
  const onPointerMove = (event: PointerEvent) => {
    if (!canvas.value || !renderer) return;
    const rect = canvas.value.getBoundingClientRect();
    renderer.setPointer(
      (event.clientX - rect.left) / rect.width,
      1 - (event.clientY - rect.top) / rect.height,
    );
  };

  onMounted(() => {
    if (!canvas.value) return;
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    renderer = createShaderRenderer(canvas.value, {
      vertex: fullscreenVertex,
      fragment: emberFragment,
      staticFrame: reducedMotion,
      onFirstFrame: () => (ready.value = true),
    });

    if (renderer && !reducedMotion) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    }
  });

  onUnmounted(() => {
    window.removeEventListener('pointermove', onPointerMove);
    renderer?.destroy();
    renderer = null;
  });
</script>
