import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const programs = [
  { label: 'Cricket', href: '#sports' },
  { label: 'Swimming', href: '#sports' },
  { label: 'Badminton', href: '#sports' },
  { label: 'Football', href: '#sports' },
  { label: 'Gym & Fitness', href: '#sports' },
  { label: 'Facility Rentals', href: '#sports' },
];

const quickLinks = [
  { label: 'About Us', href: '#about' },
  { label: 'Membership Plans', href: '#membership' },
  { label: 'Book a Ground', to: '/book-slots' },
  { label: 'Contact', href: '#contact' },
];

// Instagram SVG
const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

// Facebook SVG
const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
  </svg>
);

// WhatsApp SVG
const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subLoading, setSubLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      toast.success('Subscribed successfully!', {
        style: { background: '#0D0D0D', color: '#FFF', border: '1px solid rgba(245,166,35,0.3)' },
        iconTheme: { primary: '#22C55E', secondary: '#FFF' },
      });
      setEmail('');
    } catch {
      toast.error('Subscription failed.');
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <footer className="bg-[#0D0D0D]">

      {/* Footer Columns */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Col 1 — Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#C8102E] flex items-center justify-center shadow-lg">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#FFFFFF" opacity="0.2"/>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="none" stroke="#FFF" strokeWidth="1.5"/>
                  <path d="M8 6c2 3 2 9 0 12M16 6c-2 3-2 9 0 12" stroke="#FFF" strokeWidth="1.2" fill="none"/>
                </svg>
              </div>
              <span className="text-white text-lg" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '2px' }}>
                Red Ball
              </span>
            </div>
            <p className="text-[#9CA3AF] text-sm italic mb-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              "Where Every Delivery Counts."
            </p>
            <div className="flex items-center gap-3">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                 className="social-icon text-[#9CA3AF] hover:text-[#C8102E] hover:scale-[1.2] transition-all duration-200">
                <InstagramIcon />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                 className="social-icon text-[#9CA3AF] hover:text-[#C8102E] hover:scale-[1.2] transition-all duration-200">
                <FacebookIcon />
              </a>
              <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer"
                 className="social-icon text-[#9CA3AF] hover:text-[#C8102E] hover:scale-[1.2] transition-all duration-200">
                <WhatsAppIcon />
              </a>
            </div>
          </div>

          {/* Col 2 — Programs */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-[2px] mb-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Programs
            </h4>
            <ul className="space-y-2.5">
              {programs.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-[#9CA3AF] text-sm hover:text-white transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-[2px] mb-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  {item.to ? (
                    <Link to={item.to} className="text-[#9CA3AF] text-sm hover:text-white transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {item.label}
                    </Link>
                  ) : (
                    <a href={item.href} className="text-[#9CA3AF] text-sm hover:text-white transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Contact */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-[2px] mb-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Contact
            </h4>
            <ul className="space-y-2.5 text-sm text-[#9CA3AF]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <li>
                <a href="tel:+919876543210" className="hover:text-white transition-colors">+91 98765 43210</a>
              </li>
              <li>
                <a href="tel:+919876543211" className="hover:text-white transition-colors">+91 98765 43211</a>
              </li>
              <li>
                <a href="mailto:info@redballacademy.com" className="hover:text-white transition-colors">info@redballacademy.com</a>
              </li>
              <li className="pt-1 leading-relaxed">
                123 Sports Avenue, Sector 15, New Delhi, Delhi 110001
              </li>
            </ul>
          </div>


        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="border-t border-white/[0.08]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[#9CA3AF] text-xs text-center" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            © 2025 Red Ball Cricket Academy. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-[#9CA3AF]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <span>·</span>
            <a href="#" className="hover:text-white transition-colors">Terms & Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
