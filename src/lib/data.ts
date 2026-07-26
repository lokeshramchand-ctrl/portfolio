export type NavLink = {
  label: string;
  url: string;
};

export const navLinks: NavLink[] = [
  { label: 'Work', url: '/#work' },
  { label: 'About', url: '/#about' },
  { label: 'Contact', url: '/#contact' },
  { label: 'Blog', url: '/blog' },
];

export const socialLinks: NavLink[] = [
  { label: 'X', url: 'https://x.com/LokeshRamC' },
  { label: 'GitHub', url: 'https://github.com/lokeshramchand-ctrl' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/lokeshramchand/' },
];

export const resourceLinks: NavLink[] = [
  {
    label: 'Resume',
    url: 'https://drive.google.com/file/d/15BAHC6uRy7Imrvao6KP8DnYnx-aBJfHL/view?usp=sharing',
  },
  { label: 'GitHub', url: 'https://github.com/lokeshramchand-ctrl' },
];

export const siteConfig = {
  name: 'Lokesh Ram Chand B',
  shortName: 'Lokesh Ram Chand',
  url: 'https://lokeshrc.me',
  description:
    'Lokesh Ram Chand B — a software engineer building intelligent, scalable platforms with modern full-stack development and AI technologies.',
  email: 'lokeshramchand@gmail.com',
  whatsapp: 'https://wa.me/919121661507',
  locationPlace: `17°22'31.0"N 78°28'27.0"E`,
  locationCountry: 'Hyderabad, India',
  timezone: 'Asia/Kolkata',
};

export const heroCopy = {
  eyebrow: "I build software.",
  headline: ['Software', 'engineered well.'],
  sub: "I'm a software engineer who builds scalable applications, intelligent systems, and digital experiences that solve real problems — from full-stack products to AI-powered platforms, taken from a blank file to something people rely on.",
};

export type Project = {
  slug: string;
  name: string;
  category: string;
  year: string;
  tags: string[];
  description: string;
  url: string;
  video: string;
  poster: string;
  floor: string;
};

export const projects: Project[] = [
  {
    slug: 'velar',
    name: 'Velar',
    category: 'AI Finance System',
    year: '2024',
    tags: ['Node.js', 'Python', 'RabbitMQ'],
    description:
      'An event-driven finance platform where a Node.js API layer and a Python analysis engine talk over RabbitMQ — decoupling fast user-facing requests from heavier, model-driven work so neither one blocks the other.',
    url: 'https://github.com/lokeshramchand-ctrl/Velar',
    video: '/videos/velar.webm',
    poster: '/images/velar.webp',
    floor: 'Floor 01',
  },
  {
    slug: 'maplayer',
    name: 'MapLayer',
    category: 'GeoRAG Platform',
    year: '2025',
    tags: ['React', 'TypeScript', 'AI'],
    description:
      'A retrieval-augmented platform that grounds an LLM in spatial data, so questions about a place get answers pulled from real geography instead of a generic model guess.',
    url: 'https://github.com/lokeshramchand-ctrl/MapLayer',
    video: '/videos/maplayer.webm',
    poster: '/images/maplayer.webp',
    floor: 'Floor 02',
  },
];

export type Service = {
  number: string;
  title: string;
  body: string;
  headings: string[];
};

export const services: Service[] = [
  {
    number: '01',
    title: 'AI & Machine Learning',
    body: 'I build intelligent applications that can understand data, automate workflows, and assist users in making better decisions. My focus is on integrating modern AI into real products rather than building models that remain only as research.',
    headings: ['Machine Learning', 'Generative AI', 'Intelligent Automation'],
  },
  {
    number: '02',
    title: 'Full-Stack Engineering',
    body: 'I develop modern web and mobile applications with clean architecture, responsive interfaces, and scalable backend systems. I enjoy taking products from an initial concept to a production-ready solution while keeping performance and user experience at the center.',
    headings: ['React & Next.js', 'Flutter Development', 'Component Architecture'],
  },
  {
    number: '03',
    title: 'Backend & Infrastructure',
    body: 'I build reliable backend services capable of processing large volumes of data, supporting distributed systems, and powering modern applications. My work focuses on designing maintainable architectures that remain efficient as products grow.',
    headings: ['Distributed Systems', 'Cloud Infrastructure', 'Data Engineering'],
  },
];

export const aboutCopy = {
  intro:
    'I enjoy building software that solves meaningful problems. From intelligent AI-powered systems to scalable web applications, I focus on creating products that are reliable, intuitive, and designed to make complex workflows feel simple.',
  paragraphs: [
    "I'm a software engineer passionate about turning ideas into products that people can actually use. My work spans full-stack development, backend systems, artificial intelligence, and modern web technologies, allowing me to design solutions from concept to deployment.",
    "I enjoy working on challenging problems that involve scalability, automation, data processing, and intelligent decision-making. Whether it's building event-driven architectures, integrating machine learning into real-world applications, or developing interactive user experiences, I strive to write clean, maintainable software that creates lasting value.",
    "Beyond coding, I'm constantly exploring emerging technologies, experimenting with new frameworks, and learning how modern AI systems can enhance the way people interact with software. I believe great engineering is a balance of technical excellence, thoughtful design, and continuous curiosity.",
  ],
};

export const testimonial = {
  quote:
    'Lokesh was competent, open to direction, and gave expert advice throughout the redesign process. His positive attitude and humility make him a true joy to collaborate with.',
  author: 'Danielle Lindamood',
  role: 'Director at Wellington Water Watchers',
  photo: '/images/danielle.webp',
};

export const materials = {
  blueprint: ['TypeScript', 'System Design', 'Architecture'],
  foundation: ['Node.js', 'Python', 'PostgreSQL'],
  frame: ['React', 'Next.js', 'RabbitMQ', 'REST & GraphQL APIs'],
  glass: ['Machine Learning', 'Generative AI', 'Cloud Infrastructure'],
};

export type BlogPost = {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  tags: string[];
};

export const blogPosts: BlogPost[] = [
  {
    title: 'Owning the Stack: Building My Personal Cloud',
    slug: 'self-hosting-journey',
    date: 'July 24, 2026',
    excerpt:
      'A journey into self-hosting and the lessons learned while building a personal cloud infrastructure.',
    tags: ['Architecture', 'Self-Hosting', 'Cloud'],
  },
  {
    title: 'Building an Nginx Configuration I Could Actually Maintain',
    slug: 'nginx-config',
    date: 'June 12, 2026',
    excerpt:
      'A practical guide to creating and maintaining Nginx configurations that are both efficient and easy to manage.',
    tags: ['DevOps', 'Infrastructure', 'Engineering'],
  },
];
