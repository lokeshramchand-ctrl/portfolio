import { ref } from 'vue';

/**
 * True once the initial boot loading-screen sequence has finished.
 * Hero uses this to tell a true first mount (wait for the boot
 * animation to reveal it) apart from a later SPA remount (reveal
 * immediately, there is no curtain to wait for).
 */
export const appBooted = ref(false);

/**
 * Hash of a Home section requested from another route (e.g. clicking
 * "Projects" while on /blog). HomeView reads and clears this once it
 * has mounted and can actually scroll to it.
 */
export const pendingSection = ref<string | null>(null);
