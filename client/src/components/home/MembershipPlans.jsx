import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, Unlock, Tag, MessageCircle, CalendarDays } from 'lucide-react';

const plans = [
  {
    name: 'Monthly',
    price: '4,500',
    billing: 'Billed monthly',
    highlighted: false,
  },
  {
    name: 'Quarterly',
    price: '3,800',
    billing: 'Billed quarterly',
    highlighted: true,
    badge: '⭐ Most Popular',
  },
  {
    name: 'Half-Yearly',
    price: '3,200',
    billing: 'Billed half-yearly',
    highlighted: false,
  },
];

const features = [
  'Choose your sports (Cricket · Swimming · Gym · Badminton · Football)',
  'Priority ground booking',
  'GST receipt emailed (Brevo)',
  'Restaurant member discount',
  'Monthly progress updates',
];

const perks = [
  { icon: <Unlock size={24} />, title: 'Unlimited Access', desc: 'Full access to all your chosen facilities' },
  { icon: <Tag size={24} />, title: 'Member Discounts', desc: 'Special rates at restaurant and academy events' },
  { icon: <MessageCircle size={24} />, title: 'Free Consultations', desc: 'Personalized sessions with certified coaches' },
  { icon: <CalendarDays size={24} />, title: 'Priority Booking', desc: 'First access to new sessions and limited slots' },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function MembershipPlans() {
  return (
    <section id="membership" className="bg-[#F9F6F1] py-20 md:py-28">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <p className="uppercase tracking-[5px] text-[13px] text-[#C8102E] mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            MEMBERSHIP
          </p>
          <h2 className="section-heading text-[#0D0D0D] mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-[#9CA3AF] max-w-[600px] mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Subscribe and choose which sports to include. Flexible billing, GST receipts, and exclusive member perks.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-center mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={cardVariants}
              className={`rounded-2xl p-8 relative transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-[#C8102E] to-[#8B0B1E] text-white scale-[1.05] shadow-2xl z-10'
                  : 'bg-white text-[#0D0D0D] border border-gray-200 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)]'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#F5A623] text-[#0D0D0D] text-xs font-bold whitespace-nowrap shadow-md"
                     style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <h3 className="text-[36px] mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                {plan.name}
              </h3>

              {/* Price */}
              <div className="mb-1">
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '56px', lineHeight: 1 }}
                      className={plan.highlighted ? 'text-white' : 'text-[#C8102E]'}>
                  ₹{plan.price}
                </span>
                <span className={`text-base ml-1 ${plan.highlighted ? 'text-white/70' : 'text-[#9CA3AF]'}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  /month
                </span>
              </div>
              <p className={`text-sm mb-6 ${plan.highlighted ? 'text-white/60' : 'text-[#9CA3AF]'}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {plan.billing}
              </p>

              {/* Divider */}
              <div className={`h-px mb-6 ${plan.highlighted ? 'bg-white/20' : 'bg-gray-200'}`} />

              {/* Features */}
              <div className="space-y-3 mb-8">
                {features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check size={18} className={`shrink-0 mt-0.5 ${plan.highlighted ? 'text-[#F5A623]' : 'text-green-500'}`} />
                    <span className={`text-[15px] ${plan.highlighted ? 'text-white/80' : 'text-[#4B5563]'}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {feat}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link
                to="/login"
                className={`block w-full text-center py-3.5 rounded-full font-semibold transition-all duration-200 hover:scale-[1.03] ${
                  plan.highlighted
                    ? 'bg-[#F5A623] text-[#0D0D0D] hover:bg-[#E09410]'
                    : 'bg-[#C8102E] text-white hover:bg-[#8B0B1E]'
                }`}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Get Started →
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Membership Perks Strip */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {perks.map((perk) => (
            <div key={perk.title} className="text-center p-6 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className="text-[#C8102E] mb-3 flex justify-center">{perk.icon}</div>
              <h4 className="font-bold text-[#0D0D0D] text-sm mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {perk.title}
              </h4>
              <p className="text-xs text-[#9CA3AF]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {perk.desc}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
