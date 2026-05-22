import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../lib/axios';
import 'swiper/css';
import 'swiper/css/pagination';

const testimonials = [
  {
    sport: 'Cricket Coaching',
    text: "My son's batting has completely transformed. The coaches are incredibly patient and skilled — best decision we made.",
    name: 'Rahul M.',
  },
  {
    sport: 'Restaurant',
    text: 'The QR ordering is brilliant! Scan, order, eat — while watching the cricket. Love this place.',
    name: 'Priya S.',
  },
  {
    sport: 'Swimming',
    text: 'Best swimming coaching around. The pool is pristine and the timings are super flexible for working parents.',
    name: 'Arjun K.',
  },
  {
    sport: 'Gym & Fitness',
    text: 'Lost 10kg in 3 months with a fully personalised plan. The trainers here genuinely care about your progress.',
    name: 'Neha T.',
  },
  {
    sport: 'One-Time Booking',
    text: 'Booked the cricket ground for our office trip — seamless process, great pitch, everyone had a blast.',
    name: 'Vikram D.',
  },
];

export default function Testimonials() {
  const { isAuthenticated } = useAuthStore();
  const { data } = useQuery({
    queryKey: ['featured-reviews'],
    queryFn: () => api.get('/reviews/featured').then(r => r.data).catch(() => ({ reviews: [] })),
  });
  const visibleTestimonials = data?.reviews?.length
    ? data.reviews.map(review => ({
        sport: review.category,
        text: review.comment,
        name: review.name,
        rating: review.rating,
      }))
    : testimonials;

  return (
    <section className="bg-[#0D0D0D] py-20 md:py-28">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="uppercase tracking-[5px] text-[13px] text-[#F5A623] mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                TESTIMONIALS
              </p>
              <h2 className="section-heading text-white">
                What Our Red Ball Families Are Saying
              </h2>
            </div>
            <Link
              to={isAuthenticated ? "/user/reviews" : "/login?redirectTo=/user/reviews"}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-white/30 text-white text-sm font-medium transition-all duration-200 hover:bg-white hover:text-black whitespace-nowrap"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Write a Review →
            </Link>
          </div>

          {/* Swiper Carousel */}
          <Swiper
            modules={[Autoplay, Pagination]}
            slidesPerView={1}
            spaceBetween={24}
            loop={true}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={{ clickable: true }}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="pb-12"
          >
            {visibleTestimonials.map((t, i) => (
              <SwiperSlide key={i} className="!h-auto">
                <div
                  className="bg-[#1A1A1A] rounded-3xl p-8 border border-white/[0.08] h-full min-h-[240px] flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:border-[rgba(245,166,35,0.4)] cursor-pointer group shadow-lg"
                >
                  {/* Sport Label */}
                  <div>
                    <span
                      className="inline-block px-3 py-1 rounded-full bg-[#F5A623] text-[#0D0D0D] text-xs font-bold mb-4"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {t.sport}
                    </span>

                    {/* Review Text */}
                    <p
                      className="text-white/80 text-[15px] italic leading-relaxed mb-6"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      "{t.text}"
                    </p>
                  </div>

                  <div>
                    {/* Stars */}
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, s) => (
                        <Star key={s} size={16} className={`text-[#F5A623] ${s < (t.rating || 5) ? 'fill-[#F5A623]' : ''}`} />
                      ))}
                    </div>

                    {/* Reviewer */}
                    <p className="text-[#9CA3AF] text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      — {t.name}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </div>
    </section>
  );
}
