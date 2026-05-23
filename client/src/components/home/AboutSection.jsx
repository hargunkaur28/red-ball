import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const stats = [
  { number: 5, suffix: '+', label: 'Sports Offered' },
  { number: 500, suffix: '+', label: 'Active Members' },
  { label: 'Ground Availability', isText: true, text: '24/7' },
  { number: 1, suffix: '', label: 'On-Site Restaurant' },
];

function AnimatedNumber({ end, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const steps = 60;
          const stepTime = duration / steps;
          let current = 0;
          const increment = end / steps;
          const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, stepTime);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, hasAnimated]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function AboutSection() {
  return (
    <section id="about" className="bg-white py-20 md:py-28">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left Column — Text */}
            <div className="space-y-6">
              <p
                className="uppercase tracking-[5px] text-[13px] text-[#F5A623]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                ABOUT US
              </p>

              <h2
                className="section-heading text-[#0D0D0D]"
              >
                About Red Ball Box Cricket Academy
              </h2>

              <p
                className="text-lg text-[#6B7280] leading-relaxed"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                At Red Ball Box Cricket Academy, we believe sport has the power to transform
                lives. Whether you're a weekend player, a competitive athlete, or a family
                looking for a great outing — our expert coaches, premium grounds, and
                world-class facilities are here for you.
              </p>



              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-gray-100 mt-8">
                {stats.map((stat, i) => (
                  <div key={stat.label} className="relative text-center sm:text-left">
                    {/* Separator line (desktop only, not first item) */}
                    {i > 0 && (
                      <div className="hidden sm:block absolute left-0 top-2 bottom-2 w-px bg-gray-200" />
                    )}

                    <div className={i > 0 ? 'sm:pl-6' : ''}>
                      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2.5rem, 4vw, 4rem)', color: '#C8102E', lineHeight: 1 }}>
                        {stat.isText ? (
                          stat.text
                        ) : (
                          <AnimatedNumber end={stat.number} suffix={stat.suffix} />
                        )}
                      </p>
                      <p
                        className="text-[13px] uppercase tracking-[3px] text-[#9CA3AF] mt-1"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {stat.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column — Image Collage */}
            <div className="relative mt-8 lg:mt-0">
              <div className="relative rounded-xl overflow-hidden shadow-2xl ml-auto w-[90%] md:w-full">
                <img
                  src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=800&auto=format&fit=crop"
                  alt="Red Ball Cricket Academy Training"
                  loading="lazy"
                  className="w-full h-[300px] sm:h-[380px] md:h-[420px] object-cover"
                />
              </div>
              {/* Overlapping second image */}
              <div className="absolute -bottom-6 left-0 md:-bottom-8 md:-left-8 w-[60%] sm:w-[55%] rounded-xl overflow-hidden shadow-2xl border-4 border-white">
                <img
                  src="https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=500&auto=format&fit=crop"
                  alt="Academy Facilities"
                  loading="lazy"
                  className="w-full h-[160px] sm:h-[180px] md:h-[200px] object-cover"
                />
              </div>
              {/* Accent shape */}
              <div className="absolute -top-4 -right-4 w-16 h-16 md:w-24 md:h-24 rounded-xl bg-[#C8102E]/10 -z-10" />
              <div className="absolute -bottom-4 right-4 md:right-8 w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#F5A623]/15 -z-10" />
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
