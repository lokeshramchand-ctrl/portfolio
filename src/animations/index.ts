import gsap from 'gsap';
import MotionPathHelper from 'gsap/MotionPathPlugin';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { Ref } from 'vue';
import { lenis } from '@/main';
import { appBooted } from '@/state';

gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(MotionPathHelper);

const displayNone = (id: string) => {
  gsap.set(id, { display: 'none' });
  lenis.start();
};
const samsungErrorModal = (show: boolean = false) => {
  if (show) {
    gsap.to('#samsung-error-modal', {
      opacity: 1,
      delay: 1.5,
      duration: 1,
      ease: 'power4.inOut',
      onComplete: () => {
        gsap.to('#samsung-error-modal', {
          opacity: 0,
          delay: 12,
          duration: 1,
          ease: 'power4.inOut',
          onComplete: () => {
            displayNone('#samsung-error-modal');
          },
        });
      },
    });
  }
};

const animateSplitText = (
  id: string | string[],
  textId: string,
  duration: number = 0.8,
  stagger: number = 0.005,
  delay: number = 0,
  onStartFn: () => void = () => { },
) => {
  gsap.to(id, {
    onStart: () => {
      fadeIn(textId, 100, 2);
      onStartFn();
    },

    scrollTrigger: {
      trigger: id,
      toggleActions: 'play none none reverse',
      start: 'top bottom',
    },
    delay: delay,
    duration: duration,
    y: 0,
    autoAlpha: 1,
    stagger: stagger,
    ease: 'power4.inOut',
  });
};
const navbarScale = (selector: string, trigger: string) => {
  // trigger (#hero) is destroyed and recreated on every Home mount, so
  // this must be re-registered each time — kill any prior instance
  // bound to an already-unmounted node first.
  ScrollTrigger.getById('navbar-scale')?.kill();

  gsap.to(selector, {
    scrollTrigger: {
      id: 'navbar-scale',
      trigger: trigger,
      start: 'bottom center',
      //toggleActions: start, leave, enterBack, leaveBack
      toggleActions: 'play none none reverse',
    },
    duration: 0.6,
    scale: 1,
    ease: 'power1',
  });
};

// ! common animations
const yToZero = (id: string) => {
  gsap.to(id, {
    y: 0,
    duration: 0.4,
    ease: 'power1.inOut',
    stagger: 0.1,
  });
};

const xToZero = (id: string) => {
  gsap.to(id, {
    x: 0,
    duration: 0.4,
    ease: 'power1.inOut',
    stagger: 0.1,
    scrollTrigger: {
      trigger: id,
      toggleActions: 'play none none reverse',
    },
  });
};

const yReset = (id: string) => {
  gsap.set(id, {
    y: '100%',
  });
};

const fadeIn = (id: string, opacity: number = 1, duration: number = 0.5) => {
  gsap.to(id, {
    opacity: opacity,
    duration: duration,
    ease: 'power4.inOut',
    scrollTrigger: {
      trigger: id,
      toggleActions: 'play none none reverse',
    },
    stagger: 0.1,
  });
};

const resetOpacity = (id: string, opacity: number = 0) => {
  gsap.set(id, {
    opacity: opacity,
  });
};

// ! Magneto effects
const activateMagneto = (
  event: MouseEvent,
  magneto: Ref<HTMLElement>,
  magnetoText: Ref<HTMLElement>,
  magnetoStrengthVal: number,
  magnetoTextStrengthVal: number,
) => {
  const xDivTo = gsap.quickTo(magneto.value, 'x', {
    duration: 1,
    ease: 'elastic.out(1, 0.3)',
  });
  const xTextTo = gsap.quickTo(magnetoText.value, 'x', {
    duration: 1,
    ease: 'elastic.out(1, 0.3)',
  });

  const yTextTo = gsap.quickTo(magnetoText.value, 'y', {
    duration: 1,
    ease: 'elastic.out(1, 0.3)',
  });
  const yDivTo = gsap.quickTo(magneto.value, 'y', {
    duration: 1,
    ease: 'elastic.out(1, 0.3)',
  });

  const { clientX, clientY } = event;
  const { width, height, left, top } = magneto.value.getBoundingClientRect();

  const magnetoStrength = magnetoStrengthVal;
  const magnetoTextStrength = magnetoTextStrengthVal;
  const newX = ((clientX - left) / width - 0.5) * magnetoStrength;
  const newY = ((clientY - top) / height - 0.5) * magnetoTextStrength;
  // const newX = clientX - (left + width / 2);
  // const newY = clientY - (top + height / 2);

  // move the magneto
  xDivTo(newX);
  yDivTo(newY);

  // move the text
  xTextTo(newX);
  yTextTo(newY);
};

const resetMagneto = (
  magneto: Ref<HTMLElement>,
  magnetoText: Ref<HTMLElement>,
) => {
  const xDivTo = gsap.quickTo(magneto.value, 'x', {
    duration: 1,
    ease: 'elastic.out(1, 0.3)',
  });
  const xTextTo = gsap.quickTo(magnetoText.value, 'x', {
    duration: 1,
    ease: 'elastic.out(1, 0.3)',
  });

  const yTextTo = gsap.quickTo(magnetoText.value, 'y', {
    duration: 1,
    ease: 'elastic.out(1, 0.3)',
  });
  const yDivTo = gsap.quickTo(magneto.value, 'y', {
    duration: 1,
    ease: 'elastic.out(1, 0.3)',
  });

  xDivTo(0);
  yDivTo(0);

  // move the text
  xTextTo(0);
  yTextTo(0);
};

// ! Nav animation
const navbarEnter = (id: string) => {
  gsap.to(id, {
    x: '0%',
    opacity: 1,
    duration: 0.7,
    // ease: 'power1.inOut',
  });
};

const navbarLeave = (id: string) => {
  const x = '100%';
  gsap.to(id, {
    opacity: 0,
    onComplete: () => {
      gsap.set(id, {
        x: x,
      });
    },
  });
};

const animateNavbarEnter = (
  navbarSelector: string,
  navbarLinksSelector: string,
  contactSelector: string,
) => {
  navbarEnter(navbarSelector);
  yToZero(navbarLinksSelector);
  fadeIn(contactSelector);
};

const animateNavbarLeave = (
  navbarSelector: string,
  navbarLinksSelector: string,
  contactSelector: string,
) => {
  navbarLeave(navbarSelector);
  yReset(navbarLinksSelector);
  resetOpacity(contactSelector);
};

// ! Loading animation
const animateLoadingPath = (
  path: Ref<SVGPathElement>,
  targetPath: string,
  isSamsung: boolean,
) => {
  const tl = gsap.timeline({});
  tl.to('#loading-screen', {
    delay: 3,
    bottom: '100%',
    duration: 1,
    ease: 'power2.inOut',
    onStart: () => {
      setTimeout(() => {
        animateHeroNav();
        animateHeroEntrance();
        appBooted.value = true;
        samsungErrorModal(isSamsung);
        document.body.classList.remove('stop-scrolling');
        window.scrollTo(0, 0);
      }, 120);
    },
  });

  tl.to(
    path.value,
    {
      duration: 1,
      attr: { d: targetPath },
      ease: 'power2.inOut',
      onComplete: () => {
        gsap.set('#loading-screen', { display: 'none' });
      },
    },
    '<20%',
  );
};

const animateLoadingTextContainer = () => {
  gsap.fromTo(
    '#text',
    1,
    {
      yoyo: true,
      opacity: 0,
    },
    {
      opacity: 1,
      ease: 'circ.inOut',
    },
  );
};

const animateLoadingText = (id: string) => {
  gsap.to(id, {
    y: 0,
    duration: 1,
    ease: 'power2.inOut',
    delay: 0.5,
    stagger: 0.1,
    onComplete: () => {
      gsap.to(id, {
        delay: 1.2,
        opacity: 0,
        duration: 1,
        ease: 'power2.inOut',
        onComplete: () => {
          gsap.set(id, {
            y: '100%',
            opacity: 100,
          });
        },
      });
    },
  });
};

// ! Hero
// Chrome that lives outside Hero.vue (Navbar, legacy selectors) and
// therefore only ever needs revealing once, at true app boot.
const animateHeroNav = () => {
  gsap.to('header', {
    y: 0,
    duration: 1.5,
    ease: 'power4.inOut',
  });

  gsap.to('#svg-my-en-name g path', {
    y: 0,
    delay: 0.2,
    duration: 1.5,
    ease: 'power4.inOut',
    stagger: 0.01,
  });

  gsap.to('.overlay', {
    y: '100%',
    delay: 0.2,
    duration: 1.5,
    ease: 'power4.inOut',
    onComplete: () => {
      gsap.set('.overlay', { display: 'none' });
    },
  });

  gsap.to('#profile-img', {
    scale: 1,
    delay: 0.4,
    duration: 1.5,
    ease: 'power4.inOut',
  });
};

// Hero's own reveal (star, contact button, down arrow, intro copy).
// Called once from the boot sequence with the choreographed delays
// below, and again — instantly (delay 0) — from Hero.vue's own
// onMounted whenever it remounts after SPA navigation, since a fresh
// mount starts from the hidden CSS state with no loading curtain to
// sync against.
const animateHeroEntrance = (starDelay: number = 0.2, restDelay: number = 0.4) => {
  gsap.to('#star', {
    x: 1,
    delay: starDelay,
    duration: 1.5,
    ease: 'power4.inOut',
  });

  gsap.to(['#down-arrow', '#contact-btn', '#available-for-work'], {
    x: 0,
    y: 0,
    delay: restDelay,
    duration: 1.5,
    ease: 'power4.inOut',
  });

  animateSplitText('#whoAmI .letters', '#whoAmI .letters', 1.5, 0.005, restDelay);
};

// Hero's scroll-linked pin/scale effect. ScrollTrigger binds to the
// live DOM node, so this must be re-registered on every Hero mount —
// killing any previous instance keeps repeated Home visits from
// piling up stale triggers bound to already-unmounted nodes.
const animateHeroScrollPin = () => {
  ScrollTrigger.getById('hero-pin')?.kill();

  gsap.to('#hero', {
    scrollTrigger: {
      id: 'hero-pin',
      trigger: '#hero',
      start: 'top top',
      scrub: 1,
    },
    opacity: 0.5,
    scale: 0.9,
    translateZ: 0,
  });
};

// A little bit about me animation
const animateAboutMeSectionLeave = (id: string) => {
  gsap.to(id, {
    yPercent: -10,
    scale: 0.95,
    ease: 'power1',
    scrollTrigger: {
      trigger: id,
      start: '75% bottom',
      // end: 'bottom top',
      scrub: 1,
    },
  });
};
const animateBlogListEnter = () => {
  // 1. Force GSAP and Lenis to recognize the top of the page
  window.scrollTo(0, 0);

  const tl = gsap.timeline({
    onComplete: () => {
      // 2. Tell GSAP to recalculate the page height for Lenis
      ScrollTrigger.refresh();
    }
  });
  
  // Header text animation
  tl.fromTo('.blog-header-anim', 
    { y: 50, opacity: 0 }, 
    { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power4.out' }
  )
  // List items staggered entrance
  .fromTo('.blog-item-anim', 
    { y: 50, opacity: 0 }, 
    { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' },
    "-=0.5" // Start this half a second before the header finishes
  );
};



const animateBlogPostEnter = () => {
  const tl = gsap.timeline();

  tl.fromTo('.post-back-btn',
    { opacity: 0, x: -20 },
    { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }
  )
    .fromTo('.post-meta',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
      '-=0.3'
    )
    .fromTo('.post-title',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out' },
      '-=0.3'
    )
    .fromTo('.post-tag',
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.4, stagger: 0.1, ease: 'back.out(1.5)' },
      '-=0.4'
    )
    .fromTo('.markdown-content',
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
      '-=0.2'
    );
};


export {
  displayNone,
  xToZero,
  fadeIn,
  navbarScale,
  activateMagneto,
  resetMagneto,
  animateNavbarEnter,
  animateNavbarLeave,
  animateLoadingPath,
  animateLoadingText,
  animateLoadingTextContainer,
  animateHeroNav,
  animateHeroEntrance,
  animateHeroScrollPin,
  animateSplitText,
  animateAboutMeSectionLeave,
  animateBlogListEnter,
  animateBlogPostEnter,
  
};
