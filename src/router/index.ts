import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/intro',
    name: 'Intro',
    component: () => import('@/views/IntroView.vue'),
  },
  {
    path: '/blog',
    name: 'Blog',
    component: () => import('@/views/BlogView.vue'),
  },
  {
    path: '/blog/:slug',
    name: 'BlogPost',
    component: () => import('@/views/BlogPostView.vue'),
    props: true,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    // 1. If there is a hash (e.g., /#works), wait 100ms for DOM to render, then scroll
    if (to.hash) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            el: to.hash,
            behavior: 'smooth',
          });
        }, 100);
      });
    }
    
    // 2. If the user clicks the browser Back/Forward buttons, remember their scroll depth
    if (savedPosition) {
      return savedPosition;
    }

    // 3. Otherwise (e.g., opening a new blog post), snap instantly to the top
    return { top: 0 };
  }
});


export default router;