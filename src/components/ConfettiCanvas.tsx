/**
 * Animation confetti canvas pour célébrer la publication d'une annonce
 * @module components/ConfettiCanvas
 */

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const COLORS = [
  'hsl(142, 76%, 50%)', // vert
  'hsl(217, 91%, 60%)', // bleu
  'hsl(45, 93%, 55%)',  // or
  'hsl(340, 82%, 60%)', // rose
  'hsl(262, 83%, 58%)', // violet
  'hsl(25, 95%, 55%)',  // orange
];

/**
 * Composant canvas qui affiche des confettis puis se retire
 * @param onComplete - Callback appelé quand l'animation est terminée
 */
export default function ConfettiCanvas({ onComplete }: { onComplete?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const count = 150;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4 + 2,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        opacity: 1,
      });
    }

    let frame: number;
    let elapsed = 0;
    const duration = 3000;

    const animate = () => {
      elapsed += 16;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.vy += 0.08; // gravité
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (elapsed > duration * 0.6) {
          p.opacity = Math.max(0, p.opacity - 0.02);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (elapsed < duration) {
        frame = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      aria-hidden="true"
    />
  );
}
