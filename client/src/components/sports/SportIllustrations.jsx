import React from 'react';

export default function SportIllustration({ slug, color, className = 'w-full h-full' }) {
  const s = slug?.toLowerCase() || '';

  // Cricket
  if (s.includes('cricket')) {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="cricketRed" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff4d4d" />
            <stop offset="100%" stopColor="#990000" />
          </linearGradient>
          <linearGradient id="woodGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e5a93b" />
            <stop offset="100%" stopColor="#966115" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Stumps (Wickets) */}
        <g stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.15">
          <line x1="35" y1="25" x2="35" y2="80" />
          <line x1="50" y1="25" x2="50" y2="80" />
          <line x1="65" y1="25" x2="65" y2="80" />
          <line x1="31" y1="23" x2="69" y2="23" strokeWidth="3" />
        </g>
        
        {/* Cricket Bat */}
        <g transform="rotate(-15 50 50)">
          {/* Grip */}
          <path d="M43 15 L47 15 L47 38 L43 38 Z" fill="#222" />
          {/* Blade */}
          <path d="M40 38 L50 38 L50 82 C50 84, 40 84, 40 82 Z" fill="url(#woodGrad)" stroke="#7c4e0e" strokeWidth="1" />
          {/* Colored rubber grip accents */}
          <line x1="43" y1="20" x2="47" y2="20" stroke={color || '#C8102E'} strokeWidth="1.5" />
          <line x1="43" y1="26" x2="47" y2="26" stroke={color || '#C8102E'} strokeWidth="1.5" />
          <line x1="43" y1="32" x2="47" y2="32" stroke={color || '#C8102E'} strokeWidth="1.5" />
        </g>
        
        {/* Cricket Ball */}
        <circle cx="68" cy="68" r="14" fill="url(#cricketRed)" filter="url(#glow)" />
        {/* Ball Seam */}
        <path d="M57 60 C63 64, 69 66, 75 76" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.85" />
        <path d="M59 58 C65 62, 71 64, 77 74" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
      </svg>
    );
  }

  // Badminton
  if (s.includes('badminton')) {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="racketGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff7eb9" />
            <stop offset="100%" stopColor="#e84393" />
          </linearGradient>
          <linearGradient id="shuttleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#dddddd" />
          </linearGradient>
        </defs>
        
        {/* Racket Strings & Frame */}
        <g transform="rotate(-35 50 50)">
          {/* Handle */}
          <rect x="48" y="65" width="4" height="25" rx="1" fill="#222" />
          <rect x="47" y="62" width="6" height="3" fill="#ffffff" />
          {/* Shaft */}
          <rect x="49.5" y="42" width="1" height="20" fill="#cccccc" />
          {/* T-Joint */}
          <path d="M48 42 L52 42 L50 40 Z" fill="#cccccc" />
          {/* Frame (Oval head) */}
          <ellipse cx="50" cy="25" rx="14" ry="17" stroke="url(#racketGlow)" strokeWidth="2.5" />
          
          {/* Strings pattern */}
          <g stroke="rgba(255,255,255,0.2)" strokeWidth="0.75">
            {/* Verticals */}
            <line x1="40" y1="15" x2="40" y2="35" />
            <line x1="44" y1="10" x2="44" y2="40" />
            <line x1="48" y1="8" x2="48" y2="42" />
            <line x1="52" y1="8" x2="52" y2="42" />
            <line x1="56" y1="10" x2="56" y2="40" />
            <line x1="60" y1="15" x2="60" y2="35" />
            {/* Horizontals */}
            <line x1="38" y1="15" x2="62" y2="15" />
            <line x1="36" y1="20" x2="64" y2="20" />
            <line x1="36" y1="25" x2="64" y2="25" />
            <line x1="36" y1="30" x2="64" y2="30" />
            <line x1="38" y1="35" x2="62" y2="35" />
          </g>
        </g>
        
        {/* Flying Shuttlecock */}
        <g transform="translate(18, 38) rotate(45)">
          {/* Feathers */}
          <path d="M10 25 L5 5 L15 15 L20 5 L25 5 L20 25 Z" fill="url(#shuttleGrad)" opacity="0.9" />
          <path d="M12 25 L8 8 L14 18 L18 8 L22 25 Z" fill="none" stroke="#cccccc" strokeWidth="0.75" />
          {/* Band */}
          <rect x="10" y="24" width="10" height="2.5" fill="#e84393" />
          {/* Cork Head */}
          <path d="M10 26 C10 32, 20 32, 20 26 Z" fill="#ffffff" stroke="#e84393" strokeWidth="0.5" />
        </g>
        
        {/* Speed lines */}
        <path d="M15 62 L8 65" stroke="#e84393" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <path d="M22 69 L17 71" stroke="#e84393" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      </svg>
    );
  }

  // Gym
  if (s.includes('gym') || s.includes('fitness')) {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="ironGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#888888" />
            <stop offset="50%" stopColor="#444444" />
            <stop offset="100%" stopColor="#222222" />
          </linearGradient>
          <linearGradient id="gymAmber" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f5a623" />
            <stop offset="100%" stopColor="#ff7d1a" />
          </linearGradient>
        </defs>
        
        {/* Background energy rings */}
        <circle cx="50" cy="50" r="35" stroke="rgba(245,170,35,0.06)" strokeWidth="6" />
        <circle cx="50" cy="50" r="28" stroke="rgba(245,170,35,0.03)" strokeWidth="1" strokeDasharray="5,5" />
        
        {/* Heavy Dumbbell */}
        <g transform="rotate(30 50 50)">
          {/* Steel Handle */}
          <rect x="25" y="46" width="50" height="8" rx="2" fill="#e0e0e0" stroke="#888888" strokeWidth="1" />
          {/* Knurling */}
          <path d="M35 46 L35 54 M39 46 L39 54 M43 46 L43 54 M47 46 L47 54 M51 46 L51 54 M55 46 L55 54 M59 46 L59 54 M63 46 L63 54 M65 46 L65 54" stroke="#888888" strokeWidth="1" opacity="0.4" />
          
          {/* Left Plates */}
          <rect x="20" y="32" width="5" height="36" rx="2" fill="url(#gymAmber)" />
          <rect x="14" y="28" width="5" height="44" rx="2" fill="url(#ironGrad)" stroke="url(#gymAmber)" strokeWidth="0.5" />
          <rect x="8" y="24" width="5" height="52" rx="2.5" fill="url(#ironGrad)" />
          <rect x="25" y="42" width="2" height="16" fill="#cccccc" />
          <circle cx="6" cy="50" r="3" fill="#666666" />
          
          {/* Right Plates */}
          <rect x="75" y="32" width="5" height="36" rx="2" fill="url(#gymAmber)" />
          <rect x="81" y="28" width="5" height="44" rx="2" fill="url(#ironGrad)" stroke="url(#gymAmber)" strokeWidth="0.5" />
          <rect x="87" y="24" width="5" height="52" rx="2.5" fill="url(#ironGrad)" />
          <rect x="73" y="42" width="2" height="16" fill="#cccccc" />
          <circle cx="94" cy="50" r="3" fill="#666666" />
        </g>
        <text x="50" y="86" fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="bold" textAnchor="middle" letterSpacing="2">20 KG</text>
      </svg>
    );
  }

  // Pickleball
  if (s.includes('pickleball')) {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="paddleGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="ballYellow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e2f83c" />
            <stop offset="100%" stopColor="#86efac" />
          </linearGradient>
        </defs>
        
        {/* Paddle */}
        <g transform="rotate(-25 45 55)">
          {/* Handle */}
          <rect x="42" y="65" width="6" height="25" rx="2" fill="#ffffff" stroke="#8b5cf6" strokeWidth="1" />
          <path d="M42 70 L48 72 M42 75 L48 77 M42 80 L48 82 M42 85 L48 87" stroke="#cccccc" strokeWidth="0.75" />
          <rect x="41" y="62" width="8" height="3" fill="#a855f7" />
          {/* Neck */}
          <path d="M40 62 L50 62 L48 48 L42 48 Z" fill="#222" stroke="#a855f7" strokeWidth="1.5" />
          {/* Face */}
          <path d="M28 15 C28 15, 62 15, 62 15 C70 15, 72 25, 70 48 C68 53, 58 55, 45 55 C32 55, 22 53, 20 48 C18 25, 20 15, 28 15 Z" fill="url(#paddleGrad)" stroke="#ffffff" strokeWidth="1.5" />
          {/* Decal */}
          <path d="M24 25 Q45 45 66 25" stroke="rgba(255,255,255,0.2)" strokeWidth="3" strokeLinecap="round" />
        </g>
        
        {/* Pickleball Ball */}
        <g transform="translate(62, 58)">
          <circle cx="14" cy="14" r="14" fill="url(#ballYellow)" />
          {/* Holes */}
          <circle cx="7" cy="7" r="2" fill="#111515" />
          <circle cx="15" cy="5" r="1.5" fill="#111515" />
          <circle cx="22" cy="10" r="2" fill="#111515" />
          <circle cx="20" cy="18" r="1.5" fill="#111515" />
          <circle cx="11" cy="21" r="2.5" fill="#111515" />
          <circle cx="6" cy="15" r="1.5" fill="#111515" />
          <circle cx="13" cy="13" r="2.2" fill="#111515" />
        </g>
      </svg>
    );
  }

  // Football
  if (s.includes('football')) {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="ballGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#b5b5b5" />
          </linearGradient>
          <linearGradient id="grassGreen" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#1b4d22" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Net */}
        <path d="M10 80 L90 80 M20 80 L35 45 L65 45 L80 80 M50 45 L50 80" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeLinecap="round" />
        <path d="M30 60 L70 60" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" />
        <ellipse cx="50" cy="80" rx="35" ry="12" fill="url(#grassGreen)" />
        
        {/* Soccer Ball */}
        <g transform="translate(36, 32)">
          <circle cx="14" cy="14" r="14" fill="url(#ballGrad)" stroke="#111" strokeWidth="1" />
          <path d="M14 8 L19 12 L17 17 L11 17 L9 12 Z" fill="#222222" stroke="#111" strokeWidth="0.5" />
          <line x1="14" y1="8" x2="14" y2="0" stroke="#111" strokeWidth="1" />
          <line x1="19" y1="12" x2="26" y2="8" stroke="#111" strokeWidth="1" />
          <line x1="17" y1="17" x2="24" y2="24" stroke="#111" strokeWidth="1" />
          <line x1="11" y1="17" x2="4" y2="24" stroke="#111" strokeWidth="1" />
          <line x1="9" y1="12" x2="2" y2="8" stroke="#111" strokeWidth="1" />
          
          {/* Surrounding panels */}
          <path d="M14 0 L20 4 L19 12 M20 4 L26 8" stroke="#111" strokeWidth="1" fill="#ffffff" opacity="0.2" />
          <path d="M26 8 L28 14 L24 20 L17 17" stroke="#111" strokeWidth="1" fill="#222" opacity="0.7" />
          <path d="M24 20 L20 27 L14 28 L11 17" stroke="#111" strokeWidth="1" fill="#ffffff" opacity="0.2" />
          <path d="M14 28 L8 27 L4 20 L11 17" stroke="#111" strokeWidth="1" fill="#222" opacity="0.7" />
          <path d="M4 20 L0 14 L2 8 L9 12" stroke="#111" strokeWidth="1" fill="#ffffff" opacity="0.2" />
          <path d="M2 8 L8 4 L14 0" stroke="#111" strokeWidth="1" fill="#222" opacity="0.7" />
        </g>
        
        {/* Speed Arc */}
        <path d="M25 45 C28 32, 42 22, 58 22" stroke={color || '#22C55E'} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4,4" opacity="0.5" />
      </svg>
    );
  }

  // Swimming
  if (s.includes('swimming') || s.includes('pool')) {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="swimBlue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
        
        {/* Waves */}
        <g stroke="url(#swimBlue)" strokeWidth="3" strokeLinecap="round" opacity="0.6">
          <path d="M15 65 Q32.5 55, 50 65 T85 65" />
          <path d="M10 75 Q30 68, 50 75 T90 75" strokeWidth="2" opacity="0.4" />
          <path d="M20 55 Q35 48, 50 55 T80 55" strokeWidth="1.5" opacity="0.3" />
        </g>
        
        {/* Goggles */}
        <g transform="translate(20, 22)">
          <path d="M4 18 C15 10, 45 10, 56 18" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
          <path d="M4 22 C15 14, 45 14, 56 22" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.25" />
          
          <rect x="12" y="10" width="16" height="14" rx="7" fill="url(#swimBlue)" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="32" y="10" width="16" height="14" rx="7" fill="url(#swimBlue)" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="27.5" y="15" width="5.5" height="3" rx="1" fill="#ffffff" />
          <path d="M15 13 L21 13" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M35 13 L41 13" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
        </g>
        
        {/* Bubbles */}
        <circle cx="32" cy="60" r="2" fill="#38bdf8" opacity="0.4" />
        <circle cx="68" cy="52" r="3" fill="#38bdf8" opacity="0.3" />
        <circle cx="50" cy="72" r="1.5" fill="#38bdf8" opacity="0.5" />
      </svg>
    );
  }

  // Table tennis
  if (s.includes('tennis') || s.includes('ping') || s.includes('tt')) {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="ttRed" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="ttWood" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>
        
        {/* Net */}
        <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
        
        {/* Paddle */}
        <g transform="rotate(-15 45 45)">
          <rect x="42" y="60" width="6" height="24" rx="2" fill="url(#ttWood)" stroke="#451a03" strokeWidth="0.5" />
          <path d="M42 66 L48 66 M42 72 L48 72 M42 78 L48 78" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <circle cx="45" cy="42" r="18" fill="url(#ttRed)" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="45" cy="42" r="16.5" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>
        
        {/* Ball */}
        <circle cx="65" cy="58" r="6" fill="#ffffff" stroke="#ea580c" strokeWidth="0.5" />
        <circle cx="63" cy="56" r="1.5" fill="rgba(255,255,255,0.8)" />
      </svg>
    );
  }

  // Coaching
  if (s.includes('coaching')) {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="boardGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
        </defs>
        <rect x="25" y="15" width="50" height="70" rx="4" fill="url(#boardGrad)" stroke="#4b5563" strokeWidth="2" />
        <path d="M42 10 L58 10 L56 18 L44 18 Z" fill="#9ca3af" stroke="#4b5563" strokeWidth="1" />
        <circle cx="50" cy="14" r="1.5" fill="#374151" />
        <g stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.7">
          <circle cx="36" cy="62" r="3" fill="none" stroke="#f5a623" />
          <circle cx="64" cy="62" r="3" fill="none" stroke="#f5a623" />
          <path d="M33 33 L39 39 M39 33 L33 39" stroke="#ef4444" />
          <path d="M61 33 L67 39 M67 33 L61 39" stroke="#ef4444" />
          <path d="M36 57 Q50 45 60 56" fill="none" strokeDasharray="3,3" />
          <path d="M57 56 L61 57 L60 53" fill="#ffffff" strokeWidth="1" />
        </g>
        <g transform="translate(60, 60) scale(0.35)">
          <path d="M10 20 L25 20 C25 20, 30 10, 45 10 C60 10, 60 30, 45 30 L10 30 Z" fill="#d1d5db" stroke="#4b5563" strokeWidth="3" />
          <circle cx="45" cy="20" r="5" fill="#ef4444" />
        </g>
      </svg>
    );
  }

  // Fallback (Trophy)
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="50%" stopColor="#f5a623" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <g transform="translate(25, 20)">
        <path d="M10 10 L40 10 C40 25, 35 35, 25 40 C15 35, 10 25, 10 10 Z" fill="url(#goldGrad)" stroke="#b45309" strokeWidth="1.5" />
        <path d="M10 15 C3 15, 3 25, 10 28" fill="none" stroke="url(#goldGrad)" strokeWidth="3" strokeLinecap="round" />
        <path d="M40 15 C47 15, 47 25, 40 28" fill="none" stroke="url(#goldGrad)" strokeWidth="3" strokeLinecap="round" />
        <rect x="22" y="40" width="6" height="10" fill="url(#goldGrad)" />
        <rect x="15" y="50" width="20" height="6" rx="1" fill="#374151" stroke="#1f2937" strokeWidth="1" />
      </g>
      <g fill="#f5a623">
        <path d="M22 22 L24 26 L28 26 L25 28 L26 32 L22 30 L18 32 L19 28 L16 26 L20 26 Z" opacity="0.8" transform="scale(0.8)" />
        <path d="M72 26 L73 29 L76 29 L74 31 L75 34 L72 32.5 L69 34 L70 31 L68 29 L71 29 Z" opacity="0.8" transform="scale(0.8)" />
        <path d="M47 8 L49 11 L52 11 L50 13 L51 16 L47 14.5 L43 16 L44 13 L42 11 L45 11 Z" opacity="0.9" />
      </g>
    </svg>
  );
}
