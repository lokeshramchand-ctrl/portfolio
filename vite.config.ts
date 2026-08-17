import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import sitemap from 'vite-plugin-sitemap';
import { robots } from 'vite-plugin-robots';
import tailwindcss from '@tailwindcss/vite';
import { blogPosts } from './src/generated/blogIndex';

const blogRoutes = blogPosts.map((post) => `/blog/${post.slug}`);

const blogLastmod = Object.fromEntries(
  blogPosts.map((post) => [`/blog/${post.slug}`, new Date(post.date)]),
);

const blogPriority = Object.fromEntries(
  blogPosts.map((post) => [`/blog/${post.slug}`, 0.6]),
);

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  build: {
    sourcemap: true,
    // terserOptions:
    chunkSizeWarningLimit: 1600,
  },
  plugins: [
    tailwindcss(),
    vue(),
    robots(),
    sitemap({
      hostname: 'https://lokeshrc.me/',
      // '/' is auto-discovered from the built index.html; only routes with
      // no corresponding static HTML file need to be listed explicitly.
      dynamicRoutes: ['/blog', '/intro', ...blogRoutes],
      changefreq: { '/': 'weekly', '/blog': 'weekly', '/intro': 'monthly', ...Object.fromEntries(blogRoutes.map((r) => [r, 'monthly'])) },
      priority: { '/': 1.0, '/blog': 0.8, '/intro': 0.7, ...blogPriority },
      lastmod: blogLastmod,
      // vite-plugin-robots already owns robots.txt generation from .robots.*.txt;
      // avoid this plugin overwriting it with its own generic default.
      generateRobotsTxt: false,
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
server: {
  host: true,          // ensures external access works
  port: 5173,          // keep consistent with your dev server
  hmr: {
    protocol: 'ws',    // use WebSocket
    host: 'localhost', // force HMR to connect locally
    port: 5173
  },
  watch: {
    usePolling: true,  // helps on Windows/WSL/MINGW
    interval: 1000     // adjust if needed
  }
},

  optimizeDeps: {
    exclude: ['@tailwindcss/vite'],
    force: true,
  },
});
