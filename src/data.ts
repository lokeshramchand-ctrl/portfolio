// Nav type
export type navLinkType = {
  label: string;
  url: string;
};

// Nav
const navLinks = [
  {
    label: 'Projects',
    url: '/#works', // Added slash
  },
  {
    label: 'About',
    url: '/#about-me-section', // Added slash
  },
  {
    label: 'Testimonials',
    url: '/#testimonials-section', // Added slash
  },
  {
    label: 'Contact',
    url: '/#contact-section', // Added slash
  },
  {
    label: 'Blog',
    url: '/blog',
  }
];

const navbarLinks = [
  {
    label: 'Home',
    url: '/#app', // Added slash (or you can just use '/')
  },
  ...navLinks,
];
const socialLinks = [
  {
    label: 'X',
    url: 'https://x.com/LokeshRamC',
  },
  {
    label: 'GitHub',
    url: 'https://github.com/lokeshramchand-ctrl',
  },
  {
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/in/lokeshramchand/',
  },
];

const resourceLinks = [
  {
    label: 'Resume',
    url: 'https://drive.google.com/file/d/15BAHC6uRy7Imrvao6KP8DnYnx-aBJfHL/view?usp=sharing',
  },
  {
    label: 'GitHub',
    url: 'https://github.com/lokeshramchand-ctrl',
  },
];

const heroText =
  'A dedicated software engineer building intelligent, scalable platforms. I combine modern full-stack development with machine learning technologies to architect comprehensive, production-ready solutions.';

const locationPlace = `17°22'31.0"N 78°28'27.0"E`;
const locationCountry = 'Hyderabad, India';

// cal.com
const dataCalNamespace = '30min';
const dataCalLink = 'lokeshramchand/30min';
const dataCalConfig =
  '{"layout":"month_view", "theme": "dark", "brand": "#8C8C73"}';

export {
  socialLinks,
  resourceLinks,
  heroText,
  locationPlace,
  locationCountry,
  navLinks,
  navbarLinks,
  dataCalNamespace,
  dataCalLink,
  dataCalConfig,
};