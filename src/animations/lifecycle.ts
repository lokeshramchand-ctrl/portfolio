import { getCurrentInstance, onBeforeUnmount, onMounted } from 'vue';
import { createScope, killScope, type AnimationScope } from './registry';

let anonymousScopeSeq = 0;

// Ties a registry scope (see registry.ts) to the calling component's
// mount/unmount lifecycle. Call `run()` from onMounted (or later) to
// register animations against the scope; they're all killed together
// on unmount, no per-effect ScrollTrigger.getById(id)?.kill() needed.
const useAnimationScope = (name?: string) => {
  const instance = getCurrentInstance();
  const scopeName = name ?? `anon-scope-${instance?.uid ?? ++anonymousScopeSeq}`;

  let scope: AnimationScope | null = null;

  onMounted(() => {
    scope = createScope(scopeName);
  });

  onBeforeUnmount(() => {
    killScope(scopeName);
    scope = null;
  });

  const run = <T>(fn: () => T): T => {
    // Guards calling run() before onMounted has fired (e.g. eagerly in
    // setup()) or after onBeforeUnmount already tore the scope down —
    // either way a fresh scope is created on demand rather than throwing.
    if (!scope) {
      scope = createScope(scopeName);
    }
    return scope.run(fn);
  };

  return { run, scopeName };
};

export { useAnimationScope };
