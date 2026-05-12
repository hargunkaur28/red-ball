import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#EAEAEA]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center text-white font-bold text-sm">RB</div>
            <span className="text-sm font-semibold text-[#111111]">Red Ball Cricket Academy</span>
          </div>
          <Link to="/login" className="btn-primary text-sm gap-2">
            Sign In <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-semibold tracking-[0.3em] text-[#888888] uppercase mb-6"
          >
            [RED BALL CRICKET ACADEMY]
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl serif-heading text-[#111111] uppercase tracking-tight leading-[0.9] mb-8"
          >
            Where Champions<br />Are Made.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[#666666] max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Premium cricket coaching, state-of-the-art facilities, and a restaurant — all managed under one roof.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4"
          >
            <Link to="/login" className="btn-primary px-8 py-3 text-base gap-2">
              Get Started <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn-ghost px-8 py-3 text-base">
              Learn More
            </a>
          </motion.div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-[#EAEAEA] bg-white py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '500+', label: 'Active Members' },
            { value: '5', label: 'Sports Offered' },
            { value: '98%', label: 'Renewal Rate' },
            { value: '24/7', label: 'Facility Access' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <p className="text-4xl serif-heading text-[#111111]">{stat.value}</p>
              <p className="text-xs text-[#888888] mt-1 uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] font-semibold tracking-[0.3em] text-[#888888] uppercase mb-3 text-center">[WHAT WE OFFER]</p>
          <h2 className="text-4xl md:text-5xl serif-heading text-[#111111] uppercase tracking-tight text-center mb-16">Everything Under One Roof.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Academy', desc: 'Professional cricket coaching with certified coaches, net sessions, and match practice.' },
              { title: 'Memberships', desc: 'Flexible monthly, quarterly, and half-yearly plans across cricket, swimming, gym, and more.' },
              { title: 'Restaurant', desc: 'Order food right from your table via QR code. Fresh meals delivered while you train.' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="card hover:shadow-lg transition-shadow"
              >
                <p className="text-[10px] font-semibold tracking-[0.2em] text-[#888888] uppercase mb-3">0{i + 1}</p>
                <h3 className="text-2xl serif-heading text-[#111111] mb-3">{feature.title}</h3>
                <p className="text-sm text-[#666666] leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#EAEAEA] bg-white py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-bold text-xs">RB</div>
            <span className="text-sm text-[#666666]">© 2026 Red Ball Cricket Academy</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[#888888]">
            <a href="#features" className="hover:text-[#111111] transition-colors">Features</a>
            <Link to="/login" className="hover:text-[#111111] transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
