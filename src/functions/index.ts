import { useRoute, useRouter } from 'vue-router';
import { lenis } from '@/main';
import { pendingSection } from '@/state';

const textSplitterIntoChar = (
  text: string,
  isFancyFont: boolean = false,
  isNewLine: boolean = false,
): string => {
  const words = text.split(' ');
  const char = words.map((word) => word.split(''));

  let result = '';
  char.forEach((word) => {
    result += '<span class="text-nowrap!  overflow-clip ';
    if (isNewLine) {
      result += ' leading-none block  ';
    } else {
      result += ' inline-block ';
    }
    result += '">';

    word.forEach((char) => {
      let classes =
        'letters translate-y-[120%] inline-block will-change-auto will-change-transform ';
      if (isFancyFont) {
        classes += ' font-fancy ';
      }

      result += `<span class="${classes}">${char}</span>`;
    });

    result += '</span> ';
  });

  return result;
};

const getAvailableForWorkDate = () => {
  const date = new Date();

  const year = date.getFullYear().toString().slice(-2);
  const monthNames = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ];
  let index = date.getMonth();

  // Uncomment this if you want to include the next month
  // if (date.getMonth() < 12) {
  //   index += 1;
  // }
  const month = monthNames[index];

  return `${month} '${year}`;
};

const gotoSection = (url: string) => {
  lenis.start();
  if (url === '#testimonials-section') {
    lenis.scrollTo('#slider', { duration: 3 });
    return;
  }
  lenis.scrollTo(url, { duration: 3 });
};

const resolveSectionHash = (url: string): string => {
  const hash = url.includes('#') ? url.slice(url.indexOf('#')) : url;
  return hash === '#testimonials-section' ? '#slider' : hash;
};

/**
 * Route-aware nav-link handler shared by the desktop navbar (Link.vue)
 * and the mobile hamburger menu (Nav.vue). Link.vue also renders
 * external (https://…) and mailto:/tel: links (footer resources,
 * socials, contact email), so this only intercepts root-relative
 * internal links (starting with "/") and otherwise leaves the anchor's
 * native behavior completely alone.
 *
 * - Plain routes (e.g. "/blog") get a normal SPA `router.push`.
 * - Section hashes (e.g. "/#works") scroll directly via Lenis when
 *   already on Home; from any other route, Home is asked to scroll to
 *   the section itself once it has mounted (see `pendingSection`),
 *   rather than guessing a timeout here.
 *
 * Calls `preventDefault` for the links it does handle — these are
 * plain `<a href>` tags, not `router-link`, so without it the browser
 * would perform a real (full page reload) navigation alongside the
 * SPA one.
 */
const useSectionNav = () => {
  const router = useRouter();
  const route = useRoute();

  const goToSection = (event: Event, url: string) => {
    if (!url.startsWith('/')) return;

    event.preventDefault();
    lenis.start();

    if (!url.includes('#')) {
      router.push(url);
      return;
    }

    const hash = resolveSectionHash(url);

    if (route.path === '/') {
      lenis.scrollTo(hash, { duration: 3 });
      return;
    }

    pendingSection.value = hash;
    router.push('/');
  };

  return { goToSection };
};

export {
  textSplitterIntoChar,
  getAvailableForWorkDate,
  gotoSection,
  useSectionNav,
};
