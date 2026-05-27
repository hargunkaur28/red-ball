// Fallback visuals and metadata for sports that don't have custom images/descriptions in the DB

const FALLBACKS = {
  badminton: {
    icon: '🏸',
    tagline: 'Fast. Precise. Electrifying.',
    rentalEquipment: '🏸 Racket & Shuttle available for renting',
    description:
      'Professional indoor badminton courts with premium synthetic flooring, LED tournament lighting, and proper net standards. Whether you are a weekend warrior or training for competition, our courts deliver the performance surface you deserve.',
    features: ['Indoor Courts', 'Coaching Available', 'Equipment Rental', 'Beginner Friendly', 'LED Lighting', 'AC Courts'],
    chips: ['Indoor', 'AC Courts'],
    thumbnail: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1400&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1625310591486-6ab1bf8b81a3?q=80&w=800&auto=format&fit=crop',
    ],
    color: '#E84393',
  },
  cricket: {
    icon: '🏏',
    tagline: 'Where Box Cricket Champions Are Made.',
    rentalEquipment: '🏏 Bat & Ball available for renting',
    description:
      "Premium box cricket arenas with artificial turf, nets, high floodlights, and coaching zones. Red Ball is Rohtak's premier box cricket training and recreational play destination.",
    features: ['Turf Pitch', 'Practice Nets', 'Coaching', 'Floodlights', 'Box Cricket Cage'],
    chips: ['Box Cricket Arena', 'Floodlit'],
    thumbnail: 'https://mediarelations.gwu.edu/sites/g/files/zaxdzs5306/files/2024-06/adobestock_510555809.jpeg',
    heroImage: 'https://mediarelations.gwu.edu/sites/g/files/zaxdzs5306/files/2024-06/adobestock_510555809.jpeg',
    images: [
      'https://mediarelations.gwu.edu/sites/g/files/zaxdzs5306/files/2024-06/adobestock_510555809.jpeg',
      'https://images.unsplash.com/photo-1540747913346-19212a4b423a?q=80&w=800&auto=format&fit=crop',
    ],
    color: '#C8102E',
  },
  'box-cricket': {
    icon: '🏏',
    tagline: 'Where Box Cricket Champions Are Made.',
    rentalEquipment: '🏏 Bat & Ball available for renting',
    description:
      "Premium box cricket arenas with artificial turf, nets, high floodlights, and coaching zones. Red Ball is Rohtak's premier box cricket training and recreational play destination.",
    features: ['Turf Pitch', 'Practice Nets', 'Coaching', 'Floodlights', 'Box Cricket Cage'],
    chips: ['Box Cricket Arena', 'Floodlit'],
    thumbnail: 'https://mediarelations.gwu.edu/sites/g/files/zaxdzs5306/files/2024-06/adobestock_510555809.jpeg',
    heroImage: 'https://mediarelations.gwu.edu/sites/g/files/zaxdzs5306/files/2024-06/adobestock_510555809.jpeg',
    images: [
      'https://mediarelations.gwu.edu/sites/g/files/zaxdzs5306/files/2024-06/adobestock_510555809.jpeg',
      'https://images.unsplash.com/photo-1540747913346-19212a4b423a?q=80&w=800&auto=format&fit=crop',
    ],
    color: '#C8102E',
  },
  swimming: {
    icon: '🏊',
    tagline: 'Dive Into Excellence.',
    rentalEquipment: '🤿 Kickboards & floats available for use',
    description:
      'Olympic-standard swimming pool with temperature-controlled water, lap lanes, and a dedicated shallow zone for beginners. Professional instructors available for all age groups — from toddlers to competitive swimmers.',
    features: ['Lap Lanes', 'Temperature Controlled', 'Shallow Beginner Zone', 'Certified Coaches', 'Changing Rooms', 'All Ages Welcome'],
    chips: ['Indoor Pool', 'Heated Pool', 'All Ages'],
    thumbnail: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=600&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=1400&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=800&auto=format&fit=crop',
    ],
    color: '#0EA5E9',
  },
  gym: {
    icon: '🏋️',
    tagline: 'Forge Your Strength.',
    rentalEquipment: '🏋️ Wide range of equipment available',
    description:
      'A fully equipped strength and conditioning facility with modern machines, free weights, cardio equipment, and dedicated functional training zones. Personal trainers available to build customised plans for your goals.',
    features: ['Free Weights', 'Cardio Zone', 'Strength Machines', 'Functional Training', 'Personal Training', 'Locker Rooms'],
    chips: ['AC Facility', 'Personal Trainers', 'Equipment Included'],
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1400&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800&auto=format&fit=crop',
    ],
    color: '#F5A623',
  },
  pickleball: {
    icon: '🎾',
    tagline: 'The Fastest Growing Sport.',
    rentalEquipment: '🎾 Paddle & Ball available for renting',
    description:
      'Dedicated pickleball courts with premium cushioned flooring, proper net heights, and great lighting. Join the fastest-growing sport in India — fun for all ages, perfect for singles and doubles.',
    features: ['Dedicated Courts', 'Cushioned Flooring', 'Paddles Available', 'Coaching Sessions', 'Beginner Programs', 'Tournament Play'],
    chips: ['Indoor Courts', 'Paddles Available', 'Beginner Friendly', 'AC Facility'],
    thumbnail: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1400&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800&auto=format&fit=crop',
    ],
    color: '#A855F7',
  },
  'all-services': {
    icon: '👑',
    tagline: 'The Ultimate Access Pass.',
    rentalEquipment: '',
    description:
      'Gain VIP entry to all sports facilities at Red Ball Academy. Unlimited bookings for Box Cricket, Badminton, Pickleball, Swimming Pool, and Gym. Your absolute all-access pass to fitness and premium sports.',
    features: ['Access All Sports', 'VIP Priority Booking', 'Custom Performance Logs', 'Personalized Support', 'Unlock All Events'],
    chips: ['All Access', 'VIP Perks', 'Best Value'],
    thumbnail: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1400&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop',
    ],
    color: '#F5A623',
  },
};

const DEFAULT_FALLBACK = {
  icon: '🏆',
  tagline: 'World-Class Facilities Await.',
  description:
    'A premium sports facility at Red Ball Academy — professionally maintained, well-equipped, and open to members and walk-ins alike. Book by the hour or grab a membership for unlimited access.',
  features: ['Professional Facility', 'Trained Staff', 'Locker Rooms', 'Coaching Available'],
  chips: [],
  thumbnail: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop',
  heroImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1400&auto=format&fit=crop',
  images: ['https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop'],
  color: '#C8102E',
};

export function getSportFallback(slugOrName = '') {
  const key = slugOrName.toLowerCase().replace(/\s+/g, '-');
  return FALLBACKS[key] || DEFAULT_FALLBACK;
}
