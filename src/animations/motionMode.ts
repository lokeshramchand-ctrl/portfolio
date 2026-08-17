import { ref } from 'vue';

export type MotionMode = 'full' | 'reduced';

const reduceMotionQuery =
  typeof window !== 'undefined' && 'matchMedia' in window
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

const motionMode = ref<MotionMode>(reduceMotionQuery?.matches ? 'reduced' : 'full');

reduceMotionQuery?.addEventListener('change', (event) => {
  motionMode.value = event.matches ? 'reduced' : 'full';
});

// Scales a tween's duration down to near-instant under reduced motion
// instead of skipping it outright — several animations in this codebase
// chain follow-up state changes off onComplete/onStart callbacks, so the
// tween still has to run (and fire those) rather than being dropped.
const scaleDuration = (duration: number): number =>
  motionMode.value === 'reduced' ? Math.min(duration, 0.01) : duration;

const scaleStagger = (stagger: number): number =>
  motionMode.value === 'reduced' ? 0 : stagger;

export { motionMode, scaleDuration, scaleStagger };
