import './style.css';
// @ts-ignore: Vue SFC import - project has appropriate tooling but TS can't find the declaration here
import App from './App.vue';
import { createApp } from 'vue';
import Lenis from 'lenis';
import router from './router';
import { createHead } from '@unhead/vue/client';

// smooth scroll
const lenis = new Lenis({
  duration: 0.8,
});
function raf(time: number) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

const app = createApp(App);
const head = createHead();
app.use(router);
app.use(head);
app.mount('#app');

export { raf, lenis };