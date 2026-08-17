import gsap from 'gsap';
import { ref } from 'vue';
import type { Router, RouteLocationNormalized } from 'vue-router';

export type RouteTransitionState = 'idle' | 'leaving' | 'entering';

type RouteHandler = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
) => void | Promise<void>;

const routeTransitionState = ref<RouteTransitionState>('idle');

const leaveHandlers = new Map<string, RouteHandler>();

// Registers an extra leave handler for a named route, run (and awaited)
// after the generic crossfade below, right before the router commits
// navigation away from it — for view-specific exit choreography beyond
// the generic wrapper fade.
const onRouteLeave = (routeName: string, handler: RouteHandler): void => {
  leaveHandlers.set(routeName, handler);
};

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
// beforeEach can delay a pending navigation — so this state machine
// fills that gap: leaving (blocks navigation until resolved) ->
// entering (transient) -> idle. Other code can read routeTransitionState
// to know whether a navigation is currently mid-flight.
const installRouteTransitions = (router: Router): void => {
  router.beforeEach(async (to, from) => {
    // First navigation on a fresh page load has no real "from" route
    // (from === START_LOCATION) — nothing to fade out, and the boot
    // loading curtain already owns that reveal.
    if (from.name === undefined) return true;

    routeTransitionState.value = 'leaving';
    await defaultLeave();

    const handler = typeof from.name === 'string' ? leaveHandlers.get(from.name) : undefined;
    if (handler) await handler(to, from);

    return true;
  });

  router.afterEach(() => {
    routeTransitionState.value = 'entering';
    defaultEnter();

    // Views resolve their own entrance work independently (nextTick +
    // ScrollTrigger.refresh + animate*Enter); this just returns the
    // machine to idle once that has had a frame to start, rather than
    // staying stuck on 'entering' waiting for a callback no view sends.
    requestAnimationFrame(() => {
      routeTransitionState.value = 'idle';
    });
  });
};

export { routeTransitionState, onRouteLeave, installRouteTransitions };
