import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CinematicIntro({ onComplete }) {
  const canvasRef = useRef(null);
  const [currentWord, setCurrentWord] = useState('');
  const [impactFlash, setImpactFlash] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const skippedRef = useRef(false);

  // Skip animation handler
  const handleSkip = () => {
    if (skippedRef.current) return;
    skippedRef.current = true;
    setIntroVisible(false);
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Resize handling
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Timeline Configuration State variables
    const startTime = performance.now();
    
    // Ambient dust particles
    const particles = Array.from({ length: 120 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.6 + 0.1,
      pulse: Math.random() * 0.02
    }));

    // High velocity trail streaks
    const streaks = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: Math.random() * 200 + 50,
      speed: Math.random() * 25 + 15,
      thickness: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.1
    }));

    // Ball physics / layout parameters
    let ball = {
      x: width / 2,
      y: height / 2 + 50,
      radius: Math.min(width, height) * 0.12,
      rotation: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      alpha: 0,
      stretch: 1,
      velocityX: 0,
      velocityY: 0
    };

    // Kinetic Text sequence triggers
    const textTimeline = [
      { time: 1800, word: 'RED BALL' },
      { time: 2000, word: 'PLAY BOLDER' },
      { time: 2200, word: 'TRAIN HARDER' },
      { time: 2400, word: 'BOOK. PLAY. COMPETE.' }
    ];

    let lastTextIndex = -1;
    let transitionTriggered = false;

    // Core render loop
    const render = (now) => {
      if (skippedRef.current) return;
      const elapsed = now - startTime;

      // Clear dark cinematic background with subtle trailing for motion blur
      ctx.fillStyle = 'rgba(8, 8, 8, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // ── Ambient background fog / glow ────────────────────────────────
      const cx = width / 2;
      const cy = height / 2;
      const bgGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(width, height) * 0.6);
      bgGlow.addColorStop(0, elapsed > 1500 ? 'rgba(220, 38, 38, 0.15)' : 'rgba(30, 10, 10, 0.3)');
      bgGlow.addColorStop(1, 'rgba(4, 4, 4, 0.95)');
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      // ── Update & Draw floating dust particles ────────────────────────
      ctx.fillStyle = '#ffffff';
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.alpha += p.pulse;
        if (p.alpha > 0.8 || p.alpha < 0.1) p.pulse *= -1;

        // Wrap around bounds
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.save();
        ctx.globalAlpha = p.alpha * (elapsed < 500 ? elapsed / 500 : 1);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // ── TIMELINE LOGIC SEQUENCING ────────────────────────────────────

      // Phase 1: 0.0s - 0.5s -> Darkness to emergence
      if (elapsed > 400 && elapsed <= 1000) {
        const p = (elapsed - 400) / 600; // 0 to 1
        // Smooth ease out
        const easeOut = 1 - Math.pow(1 - p, 3);
        ball.alpha = easeOut;
        ball.scaleX = 0.5 + easeOut * 0.5; // goes to 1.0
        ball.scaleY = 0.5 + easeOut * 0.5;
        ball.y = height / 2 + 30 * (1 - easeOut);
        ball.rotation += 0.005;
      }

      // Phase 2: 1.0s - 1.5s -> Cinematic slow rotation & lighting sweep
      if (elapsed > 1000 && elapsed <= 1500) {
        ball.alpha = 1;
        ball.scaleX = 1.0;
        ball.scaleY = 1.0;
        ball.rotation += 0.012; // slow cinematic roll
        
        // Sweep atmospheric commercial light ray behind ball
        const sweepProgress = (elapsed - 1000) / 500;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 120;
        ctx.beginPath();
        ctx.moveTo(cx - 500 + sweepProgress * 1000, 0);
        ctx.lineTo(cx - 300 + sweepProgress * 1000, height);
        ctx.stroke();
        ctx.restore();
      }

      // Phase 3: 1.5s+ -> Explosive rocket launch forward
      if (elapsed > 1500 && elapsed <= 2500) {
        const p = (elapsed - 1500) / 1000;
        const easeLaunch = Math.pow(p, 3); // velocity accelerating exponential curve
        
        ball.rotation += 0.08 + easeLaunch * 0.2; // spin velocity spikes up
        
        // Velocity stretch distortion: ball squashes vertically and stretches horizontally slightly before scaling massive
        ball.stretch = 1 + easeLaunch * 0.4;
        
        // Draw fast moving radial light streaks and high-velocity blurs
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.6)';
        streaks.forEach((s) => {
          s.x -= s.speed * (1 + easeLaunch * 2);
          if (s.x < -s.length) {
            s.x = width + s.length;
            s.y = Math.random() * height;
          }
          ctx.save();
          ctx.globalAlpha = s.alpha * easeLaunch;
          ctx.lineWidth = s.thickness;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x + s.length, s.y);
          ctx.stroke();
          ctx.restore();
        });

        // Trigger typography sequence synchronously
        textTimeline.forEach((item, idx) => {
          if (elapsed >= item.time && lastTextIndex < idx) {
            lastTextIndex = idx;
            setCurrentWord(item.word);
          }
        });

        // Slight screen shake physics effect mapping
        const shakeX = (Math.random() - 0.5) * easeLaunch * 12;
        const shakeY = (Math.random() - 0.5) * easeLaunch * 12;
        ctx.translate(shakeX, shakeY);
      }

      // Phase 4: 2.4s - 2.6s -> Direct full-screen impact blast
      if (elapsed > 2400 && !transitionTriggered) {
        transitionTriggered = true;
        setImpactFlash(true);
        // Start smooth morph complete timeout
        setTimeout(() => {
          setIntroVisible(false);
          setTimeout(() => {
            onComplete();
          }, 300);
        }, 350);
      }

      // Scale up massive toward user at the final frames
      if (elapsed > 2300) {
        const finalP = (elapsed - 2300) / 300;
        ball.scaleX = 1 + finalP * 12;
        ball.scaleY = 1 + finalP * 12;
      }

      // ── DRAW GLOSSY LEATHER CRICKET BALL ─────────────────────────────
      if (ball.alpha > 0 && elapsed <= 2650) {
        ctx.save();
        ctx.translate(ball.x, ball.y);
        ctx.scale(ball.scaleX * ball.stretch, ball.scaleY / Math.sqrt(ball.stretch));
        ctx.rotate(ball.rotation);
        ctx.globalAlpha = ball.alpha;

        // Soft back drop shadow behind the ball
        ctx.beginPath();
        ctx.arc(0, 0, ball.radius * 1.25, 0, Math.PI * 2);
        const shadowGrad = ctx.createRadialGradient(0, 0, ball.radius * 0.8, 0, 0, ball.radius * 1.25);
        shadowGrad.addColorStop(0, 'rgba(180, 20, 20, 0.45)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGrad;
        ctx.fill();

        // Base glossy sphere body
        ctx.beginPath();
        ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
        const baseGrad = ctx.createRadialGradient(
          -ball.radius * 0.35, 
          -ball.radius * 0.35, 
          ball.radius * 0.08, 
          0, 
          0, 
          ball.radius
        );
        baseGrad.addColorStop(0, '#ffaaaa'); // strong overhead stadium rim light specular
        baseGrad.addColorStop(0.12, '#DC2626'); // pure crimson premium dye
        baseGrad.addColorStop(0.55, '#880000'); // natural leather shading midtone
        baseGrad.addColorStop(0.9, '#330000'); // deep dark studio shadow core
        baseGrad.addColorStop(1, '#110000'); // edge outline
        ctx.fillStyle = baseGrad;
        ctx.fill();

        // Realistic curved multi-thread stitch lines (cricket ball seam)
        ctx.lineWidth = Math.max(1.5, ball.radius * 0.035);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.setLineDash([ball.radius * 0.06, ball.radius * 0.05]);
        
        // Seam ring 1
        ctx.beginPath();
        ctx.ellipse(0, 0, ball.radius * 0.18, ball.radius * 0.98, Math.PI / 14, 0, Math.PI * 2);
        ctx.stroke();

        // Seam ring 2
        ctx.beginPath();
        ctx.ellipse(0, 0, ball.radius * 0.06, ball.radius * 0.98, Math.PI / 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Secondary glossy lens highlight arc overlay
        ctx.beginPath();
        ctx.arc(0, 0, ball.radius * 0.95, -Math.PI * 0.75, -Math.PI * 0.35);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = ball.radius * 0.06;
        ctx.stroke();

        ctx.restore();
      }

      // Reset matrix if translated during shake
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {introVisible && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] overflow-hidden bg-[#080808] select-none flex items-center justify-center pointer-events-auto"
        >
          {/* Main high fidelity web rendering surface */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

          {/* ── GIANT KINETIC COMMERCIAL TYPOGRAPHY OVERLAYS ─────────────── */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
            <AnimatePresence mode="wait">
              {currentWord && (
                <motion.h2
                  key={currentWord}
                  initial={{ opacity: 0, scale: 0.75, filter: 'blur(20px)', letterSpacing: '-0.05em' }}
                  animate={{ opacity: 1, scale: 1.1, filter: 'blur(0px)', letterSpacing: '0.02em' }}
                  exit={{ opacity: 0, scale: 1.4, filter: 'blur(12px)' }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-extrabold tracking-tight text-white uppercase text-center drop-shadow-[0_10px_30px_rgba(220,38,38,0.5)]"
                >
                  {currentWord}
                </motion.h2>
              )}
            </AnimatePresence>
          </div>

          {/* ── IMPACT SCREEN FLASH (WHITE/RED REVEAL) ───────────────────── */}
          {impactFlash && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0.9, 1, 0] }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute inset-0 bg-gradient-to-r from-white via-[#DC2626] to-white mix-blend-screen pointer-events-none" 
            />
          )}

          {/* ── SKIP INTRO MINIMALIST ACTION ─────────────────────────────── */}
          <div className="absolute top-6 right-6 z-50">
            <button 
              onClick={handleSkip}
              className="group flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white text-xs font-mono tracking-widest uppercase transition-all duration-300 active:scale-95 cursor-pointer shadow-lg"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DC2626] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DC2626]"></span>
              </span>
              <span className="text-[10px] font-bold text-white/80 group-hover:text-white">Skip Intro</span>
            </button>
          </div>

          {/* Bottom subtle ambient watermark overlay */}
          <div className="absolute bottom-6 inset-x-0 text-center pointer-events-none">
            <p className="text-[9px] font-mono tracking-[0.4em] text-white/30 uppercase">
              Cinematic Launch Engine Enabled
            </p>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
