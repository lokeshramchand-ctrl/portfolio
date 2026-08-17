import gsap from 'gsap';

// Named wrapper around gsap.context(): every ScrollTrigger/tween/timeline
// created inside `scope.run(fn)` is captured automatically, so `kill()`
// tears all of it down in one call. This replaces the repeated manual
// pattern elsewhere in this codebase (ScrollTrigger.getById(id)?.kill()
// before re-registering on remount) with something that can't miss an
// instance, since gsap.context() tracks everything created during the run.
export interface AnimationScope {
  readonly name: string;
  run: <T>(fn: () => T) => T;
  kill: () => void;
}

const scopes = new Map<string, AnimationScope>();

const createScope = (name: string): AnimationScope => {
  // Re-creating a scope under a name that's already live (e.g. a
  // component remounting without its previous instance having torn
  // down yet) kills the stale one first, so its animations never
  // outlive the DOM nodes they targeted.
  scopes.get(name)?.kill();

  const context = gsap.context();

  const scope: AnimationScope = {
    name,
    run: (fn) => context.add(fn) as ReturnType<typeof fn>,
    kill: () => {
      context.revert();
      scopes.delete(name);
    },
  };

  scopes.set(name, scope);
  return scope;
};

const killScope = (name: string): void => {
  scopes.get(name)?.kill();
};

export { createScope, killScope };
