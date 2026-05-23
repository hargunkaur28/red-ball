import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const hours = [
  { day: 'Monday – Friday', time: '6:00 AM – 8:00 PM' },
  { day: 'Saturday', time: '6:00 AM – 6:00 PM' },
  { day: 'Sunday', time: '8:00 AM – 4:00 PM' },
];

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all fields.');
      return;
    }
    setLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1200));
      toast.success("Message sent! We'll be in touch.", {
        style: {
          background: '#0D0D0D',
          color: '#FFFFFF',
          border: '1px solid rgba(200,16,46,0.3)',
        },
        iconTheme: { primary: '#22C55E', secondary: '#FFFFFF' },
      });
      setForm({ name: '', email: '', message: '' });
    } catch {
      toast.error('Something went wrong. Please try again.', {
        style: {
          background: '#0D0D0D',
          color: '#FFFFFF',
          border: '1px solid rgba(200,16,46,0.3)',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="bg-[#0D0D0D] py-20 md:py-28">
      <Toaster position="top-right" />
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

            {/* Left Column — Contact Info + Form */}
            <div className="space-y-8">
              <h2
                className="text-white"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2.5rem, 4vw, 3rem)' }}
              >
                Get In Touch
              </h2>

              {/* Contact Details */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="text-[#C8102E] shrink-0 mt-1" />
                  <p className="text-[#9CA3AF] text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Sector 22-D, Jhajjar Road, near Village-Maina Rohtak, Haryana 124001
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={20} className="text-[#C8102E] shrink-0" />
                  <div className="flex items-center gap-3 text-sm text-[#9CA3AF]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <a href="tel:+919350076653" className="hover:text-white transition-colors">+91 93500 76653</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-[#C8102E] shrink-0" />
                  <a href="mailto:redballcricketground@gmail.com" className="text-sm text-[#9CA3AF] hover:text-white transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    redballcricketground@gmail.com
                  </a>
                </div>
              </div>

              {/* Operating Hours */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={18} className="text-[#F5A623]" />
                  <span className="text-white font-semibold text-sm uppercase tracking-[2px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Operating Hours
                  </span>
                </div>
                <div className="bg-[#1A1A1A] rounded-xl border border-white/[0.08] overflow-hidden">
                  {hours.map((h, i) => (
                    <div key={h.day} className={`flex justify-between px-5 py-3 text-sm ${i < hours.length - 1 ? 'border-b border-white/[0.05]' : ''}`}>
                      <span className="text-white/70" style={{ fontFamily: "'DM Sans', sans-serif" }}>{h.day}</span>
                      <span className="text-white font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-5 py-3.5 rounded-xl bg-[#1A1A1A] border border-white/[0.08] text-white placeholder-white/30 text-sm focus:border-[#C8102E] focus:outline-none transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-5 py-3.5 rounded-xl bg-[#1A1A1A] border border-white/[0.08] text-white placeholder-white/30 text-sm focus:border-[#C8102E] focus:outline-none transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
                <textarea
                  placeholder="Your Message"
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-5 py-3.5 rounded-xl bg-[#1A1A1A] border border-white/[0.08] text-white placeholder-white/30 text-sm focus:border-[#C8102E] focus:outline-none transition-colors resize-none"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-[#C8102E] text-white font-semibold transition-all duration-200 hover:bg-[#8B0B1E] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            </div>

            {/* Right Column — Google Map */}
            <div className="rounded-xl overflow-hidden h-full min-h-[500px] border border-white/[0.08]">
              <iframe
                src="https://maps.google.com/maps?q=Red+Ball+Cricket+Ground+Rohtak&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: '12px', minHeight: '500px' }}
                allowFullScreen
                loading="lazy"
                title="Red Ball Cricket Academy Location"
              />
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
