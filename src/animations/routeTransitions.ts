import gsap from 'gsap';
import type { Router } from 'vue-router';

// Generic crossfade on the #route-view wrapper (see App.vue). Runs for
// every navigation regardless of route, underneath each view's own
// entrance animation — those still animate their own elements in from
// opacity 0/translated state, this just fades the outgoing page out
// and the incoming one back in around them.
const defaultLeave = (): Promise<void> =>
  new Promise((resolve) => {
    gsap.to('#route-view', {
      opacity: 0,
      duration: 0.15,
      ease: 'power1.in',
      onComplete: () => resolve(),
    });
  });

const defaultEnter = (): void => {
  gsap.to('#route-view', {
    opacity: 1,
    duration: 0.25,
    ease: 'power1.out',
  });
};

// vue-router has no built-in "wait for a leave animation" hook — only
// beforeEach can delay a pending navigation — so this fills that gap:
// block the pending navigation on the leave fade, then run the enter
// fade once it lands.
const installRouteTransitions = (router: Router): void => {
  router.beforeEach(async (_to, from) => {
    // First navigation on a fresh page load has no real "from" route
    // (from === START_LOCATION) — nothing to fade out, and the boot
    // loading curtain already owns that reveal.
    if (from.name === undefined) return true;

    await defaultLeave();
    return true;
  });

  router.afterEach(() => {
    defaultEnter();
  });
};

export { installRouteTransitions };
