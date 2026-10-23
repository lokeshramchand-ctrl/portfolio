<template>
  <section class="padding-x mx-auto flex min-h-svh max-w-3xl flex-col gap-6 py-32 sm:py-40">
    <p class="font-mono text-sm font-bold tracking-[0.2em] text-flax-smoke-400 uppercase">
      [ Legal ]
    </p>
    <h1 class="heading-1-alt font-fancy font-bold tracking-tight text-flax-smoke-900 uppercase">
      {{ page.title }}
    </h1>
    <p class="font-mono text-sm text-flax-smoke-500">Last updated: {{ updated }}</p>
    <div v-for="s in page.sections" :key="s.heading" class="flex flex-col gap-2">
      <h2 class="heading-5 font-bold text-flax-smoke-900">{{ s.heading }}</h2>
      <p class="font-medium text-flax-smoke-700">{{ s.body }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed, onMounted } from 'vue';
  import { useSeo } from '@/seo/useSeo';
  import { lenis, raf } from '@/main';

  const props = defineProps<{ kind: 'privacy' | 'terms' }>();

  const updated = '22 October 2026';
  const contact = 'lokeshramchand@gmail.com';

  const pages = {
    privacy: {
      title: 'Privacy Policy',
      description: 'What data lokeshrc.me collects and how it is used.',
      sections: [
        {
          heading: 'Who runs this site',
          body: `lokeshrc.me is a personal portfolio run by Lokesh Ram Chand (Hyderabad, India). Contact: ${contact}.`,
        },
        {
          heading: 'What is collected',
          body: 'The site has no accounts, forms or comments. It uses a self-hosted, cookieless analytics tool (Rybbit) that records page views, referrer, browser, device type and approximate country. It does not set cookies, store identifiers in your browser or track you across sites, so no cookie banner is shown.',
        },
        {
          heading: 'Third parties',
          body: 'Fonts load from Google Fonts, which receives your IP address when you visit. If you book a call through Cal.com, or message via WhatsApp or email, those services handle what you send under their own policies. Links to GitHub, X, LinkedIn and Google Drive leave this site and are governed by those sites.',
        },
        {
          heading: 'Email and messages',
          body: 'If you email or message me, I use your details only to reply and do not share them.',
        },
        {
          heading: 'Your rights',
          body: `Under the GDPR and similar laws you may ask what data I hold about you, or ask for it to be corrected or deleted. Email ${contact}. Analytics data is aggregate and not tied to an identity, so there is usually nothing to retrieve.`,
        },
        {
          heading: 'Changes',
          body: 'This page will be updated when the site changes; the date above shows the latest revision.',
        },
      ],
    },
    terms: {
      title: 'Terms of Use',
      description: 'Terms for using lokeshrc.me.',
      sections: [
        {
          heading: 'Use of the site',
          body: 'You may browse and share links to this site. Please do not scrape it abusively, attempt to disrupt it or misrepresent its content.',
        },
        {
          heading: 'Content',
          body: 'Text, design and code on this site are © Lokesh Ram Chand unless stated otherwise. Open-source projects linked from here carry their own licences. Blog posts may be quoted with attribution and a link.',
        },
        {
          heading: 'No warranty',
          body: 'The site and its content are provided as is, without warranties of any kind. Blog posts reflect my views at the time of writing and are not professional advice.',
        },
        {
          heading: 'External links',
          body: 'I am not responsible for the content or practices of third-party sites linked from here.',
        },
        {
          heading: 'Liability and governing law',
          body: 'To the extent permitted by law, I am not liable for any loss arising from use of this site. These terms are governed by the laws of India.',
        },
        {
          heading: 'Contact',
          body: `Questions about these terms: ${contact}.`,
        },
      ],
    },
  };

  const page = computed(() => pages[props.kind]);

  useSeo(() => ({
    title: `${page.value.title} | Lokesh Ram Chand`,
    description: page.value.description,
    path: `/${props.kind}`,
  }));

  onMounted(() => {
    document.body.classList.remove('stop-scrolling');
    requestAnimationFrame(raf);
    lenis.start();
  });
</script>
