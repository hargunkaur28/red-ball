import { useState } from 'react';
import { motion } from 'framer-motion';
import CinematicIntro from '../components/CinematicIntro';
import Navbar from '../components/home/Navbar';
import HeroSection from '../components/home/HeroSection';
import FacilityRentals from '../components/home/FacilityRentals';

import AboutSection from '../components/home/AboutSection';
import ValuesMarquee from '../components/home/ValuesMarquee';
import FeaturedMenu from '../components/home/FeaturedMenu';
import RestaurantTeaser from '../components/home/RestaurantTeaser';
import MembershipPlans from '../components/home/MembershipPlans';
import Testimonials from '../components/home/Testimonials';
import MotivationalBanner from '../components/home/MotivationalBanner';
import ContactSection from '../components/home/ContactSection';
import Footer from '../components/home/Footer';
import ScrollToTop from '../components/home/ScrollToTop';
import WhatsAppFloat from '../components/home/WhatsAppFloat';

function FlowSection({ children, theme = 'dark', id }) {
  return (
    <motion.div
      id={id}
      data-theme={theme}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {children}
    </motion.div>
  );
}

let hasPlayedIntroThisSession = false;

export default function Home() {
  // Play landing animation on fresh page load or refresh, but skip on SPA navigation back to Home
  const [showIntro, setShowIntro] = useState(!hasPlayedIntroThisSession);

  const handleIntroComplete = () => {
    hasPlayedIntroThisSession = true;
    setShowIntro(false);
  };

  const replayLandingAnimation = () => {
    setShowIntro(true);
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Cinematic Landing Animation (plays once per session) */}
      {showIntro && (
        <CinematicIntro onComplete={handleIntroComplete} />
      )}

      {/* Main Homepage Content — fades in after intro */}
      {!showIntro && <Navbar />}
      <motion.div
        initial={showIntro ? { opacity: 0, filter: 'blur(20px)', scale: 1.04 } : { opacity: 1, filter: 'blur(0px)', scale: 1 }}
        animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: showIntro ? 0.15 : 0 }}
      >
        <HeroSection />
        <FlowSection id="section-sports">
          <FacilityRentals />
        </FlowSection>

        <FlowSection id="section-featured-menu" theme="light">
          <FeaturedMenu />
        </FlowSection>
        <FlowSection id="section-restaurant" theme="dark">
          <RestaurantTeaser />
        </FlowSection>

        <div id="section-about" data-theme="light">
          <AboutSection />
        </div>
        <ValuesMarquee />
        <FlowSection id="section-membership" theme="dark">
          <MembershipPlans />
        </FlowSection>
        <Testimonials />
        <MotivationalBanner />
        <ContactSection />
        <Footer />
        <ScrollToTop />
        <WhatsAppFloat />

      </motion.div>
    </div>
  );
}
