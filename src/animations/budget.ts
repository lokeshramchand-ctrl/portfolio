import { ref } from 'vue';
import { isLowPowerDevice } from './deviceCapabilities';
import { motionMode } from './motionMode';

export type AnimationPriority = 'critical' | 'standard' | 'decorative';

// How many decorative animations (parallax dips, ambient motion — not
// needed for content to become visible/usable) are allowed to run at
// once. Scroll-triggered effects can otherwise pile up when a user
// scrolls fast past several of them in a burst.
const MAX_CONCURRENT_DECORATIVE = 3;

const activeDecorative = ref(0);

// Whether an animation of the given priority should run at all right
// now, given motion mode, device tier, and how many decorative
// animations are already in flight. Critical animations (nav reveal,
// page entrances) always run — skipping those would leave content
// stuck in its pre-animation hidden state.
const canRunAnimation = (priority: AnimationPriority): boolean => {
  if (priority === 'critical') return true;
  if (motionMode.value === 'reduced') return priority !== 'decorative';
  if (isLowPowerDevice.value && priority === 'decorative') return false;
  if (priority === 'decorative' && activeDecorative.value >= MAX_CONCURRENT_DECORATIVE) return false;
  return true;
};

// Wraps an animation-creating function with budget bookkeeping: skips
// calling `fn` entirely (falling back to `instantEnd`, if given, so the
// element still lands in a sane state rather than staying stuck wherever
// it started) when the budget says no, and tracks in-flight decorative
// animations for the concurrency cap above.
const runWithBudget = (
  priority: AnimationPriority,
  fn: () => gsap.core.Tween | gsap.core.Timeline | void,
  instantEnd?: () => void,
): void => {
  if (!canRunAnimation(priority)) {
    instantEnd?.();
    return;
  }

  if (priority !== 'decorative') {
    fn();
    return;
  }

  activeDecorative.value += 1;
  const result = fn();

  const release = () => {
    activeDecorative.value = Math.max(0, activeDecorative.value - 1);
  };

  if (result) {
    result.eventCallback('onComplete', release);
  } else {
    release();
  }
};

export { runWithBudget };
