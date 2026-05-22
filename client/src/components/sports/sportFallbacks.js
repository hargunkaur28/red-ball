// Fallback visuals and metadata for sports that don't have custom images/descriptions in the DB

const FALLBACKS = {
  badminton: {
    icon: '🏸',
    tagline: 'Fast. Precise. Electrifying.',
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
    tagline: 'Where Champions Are Made.',
    description:
      'Full-size cricket ground with turf pitches, practice nets, and coaching zones. Red Ball is Chandigarh\'s premier cricket training destination — from grassroots development to professional-level drills.',
    features: ['Turf Pitches', 'Practice Nets', 'Coaching', 'Fielding Zones', 'Floodlights', 'Box Cricket'],
    chips: ['Outdoor Ground', 'Floodlit'],
    thumbnail: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=600&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1400&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540747913346-19212a4b423a?q=80&w=800&auto=format&fit=crop',
    ],
    color: '#C8102E',
  },
  swimming: {
    icon: '🏊',
    tagline: 'Dive Into Excellence.',
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
  football: {
    icon: '⚽',
    tagline: 'Play Beautiful. Play Here.',
    description:
      'Astroturf and natural grass football pitches for 5-a-side, 7-a-side, and full 11-a-side matches. Ideal for casual games, corporate events, and structured training sessions.',
    features: ['Astroturf Pitch', 'Natural Grass', '5-a-side Setup', 'Changing Rooms', 'Floodlights', 'Goal Posts'],
    chips: ['Outdoor', 'Floodlit', '5-a-side Available'],
    thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1400&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop',
    ],
    color: '#22C55E',
  },
  pickleball: {
    icon: '🎾',
    tagline: 'The Fastest Growing Sport.',
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
  'table-tennis': {
    icon: '🏓',
    tagline: 'Speed Meets Precision.',
    description:
      'Professional table tennis tables in a dedicated, air-conditioned hall. Whether you are perfecting your serve or playing a friendly match, our TT zone offers the ideal environment for every level.',
    features: ['Professional Tables', 'AC Hall', 'Paddles & Balls', 'Coaching Available', 'Tournament Tables', 'Beginner Friendly'],
    chips: ['Indoor', 'AC Hall', 'Equipment Provided'],
    thumbnail: 'https://images.unsplash.com/photo-1611251126112-45f7ce43b12e?q=80&w=600&auto=format&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1611251126112-45f7ce43b12e?q=80&w=1400&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1611251126112-45f7ce43b12e?q=80&w=800&auto=format&fit=crop',
    ],
    color: '#F97316',
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
