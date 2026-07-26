import Hero from "@/components/sections/Hero";
import ConstructionStory from "@/components/sections/ConstructionStory";
import Works from "@/components/sections/Works";
import About from "@/components/sections/About";
import Testimonial from "@/components/sections/Testimonial";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Hero />
      <ConstructionStory />
      <Works />
      <About />
      <Testimonial />
      <Contact />
    </>
  );
}
