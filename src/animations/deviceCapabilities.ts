import { computed, ref } from 'vue';

export type DeviceTier = 'low' | 'mid' | 'high';

const coarsePointerQuery =
  typeof window !== 'undefined' && 'matchMedia' in window
    ? window.matchMedia('(pointer: coarse)')
    : null;

// Coarse pointer (touch) devices don't have a mouse to track, so this
// also functions as "should pointer-following effects (custom cursor,
// magnetic hover) even attach their listeners" — checked once at
// module init since pointer type doesn't change mid-session, but kept
// reactive in case a device is used with both touch and a mouse.
const isCoarsePointer = ref(coarsePointerQuery?.matches ?? false);
coarsePointerQuery?.addEventListener('change', (event) => {
  isCoarsePointer.value = event.matches;
});

const isTouch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;

const cores =
  typeof navigator !== 'undefined' && 'hardwareConcurrency' in navigator
    ? navigator.hardwareConcurrency
    : 4;

// navigator.connection is Chromium-only and unstandardized; missing on
// Safari/Firefox, so this always degrades to `false` there rather than
// ever assuming the connection is constrained.
const connection = typeof navigator !== 'undefined' ? (navigator as any).connection : undefined;
const saveData = Boolean(connection?.saveData);

// A rough, conservative tier used to decide whether decorative-only
// effects are worth running at all — see budget.ts, which spends this
// alongside motion mode to gate non-critical animations.
const deviceTier = computed<DeviceTier>(() => {
  if (saveData || cores <= 2) return 'low';
  if (isCoarsePointer.value || cores <= 4) return 'mid';
  return 'high';
});

const isLowPowerDevice = computed(() => deviceTier.value === 'low');

export { isCoarsePointer, isTouch, cores, saveData, deviceTier, isLowPowerDevice };
