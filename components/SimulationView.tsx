
import React, { useRef, useEffect, useMemo } from 'react';
import { SimulationState } from '../types';
import { EARTH_RADIUS } from '../constants';

interface SimulationViewProps {
  state: SimulationState;
}

const SimulationView: React.FC<SimulationViewProps> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate a static starfield
  const stars = useMemo(() => {
    return Array.from({ length: 200 }).map(() => ({
      x: Math.random() * 2000 - 1000,
      y: Math.random() * 2000 - 1000,
      size: Math.random() * 2,
      opacity: Math.random() * 0.8 + 0.2
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Altitude-based Zoom
    const altitude = Math.sqrt(state.position.x**2 + state.position.y**2) - EARTH_RADIUS;
    const zoom = Math.max(0.00005, 800 / (Math.max(10, altitude) + 5000));
    
    // Camera Shake based on Acceleration and Dynamic Pressure
    let shakeX = 0;
    let shakeY = 0;
    const accelG = Math.sqrt(state.acceleration.x**2 + state.acceleration.y**2) / 9.81;
    if (accelG > 1.5 && !state.isPaused) {
      const intensity = (accelG - 1.5) * 0.5 + (state.throttle * 2);
      shakeX = (Math.random() - 0.5) * intensity;
      shakeY = (Math.random() - 0.5) * intensity;
    }

    // Background: Deep Space
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(centerX + shakeX, centerY + shakeY);
    ctx.scale(zoom, zoom);
    
    // Camera follows rocket
    const rx = state.position.x;
    const ry = state.position.y;
    ctx.translate(-rx, -ry);

    // Draw Stars (Parallax)
    stars.forEach(star => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      // Subtle parallax: stars move slower than rocket
      const sx = rx * 0.999 + star.x / zoom;
      const sy = ry * 0.999 + star.y / zoom;
      ctx.beginPath();
      ctx.arc(sx, sy, star.size / zoom, 0, Math.PI * 2);
      ctx.fill();
    });

    // Earth Atmosphere Glow (Light Scattering)
    const atmRadius = EARTH_RADIUS + 100000;
    const grad = ctx.createRadialGradient(0, 0, EARTH_RADIUS, 0, 0, atmRadius);
    grad.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    grad.addColorStop(0.5, 'rgba(147, 197, 253, 0.1)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, atmRadius, 0, Math.PI * 2);
    ctx.fill();

    // Earth Surface
    ctx.beginPath();
    ctx.arc(0, 0, EARTH_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e3a8a';
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1000;
    ctx.stroke();

    // Rocket Rendering
    ctx.translate(rx, ry);
    const globalRot = Math.atan2(ry, rx) - Math.PI / 2 + (state.rotation * Math.PI / 180);
    ctx.rotate(globalRot);

    const rw = 12 / zoom;
    const rh = 45 / zoom;

    // Exhaust Particles
    if (state.throttle > 0 && state.stages[state.currentStageIndex]?.fuelMass > 0) {
      const flameH = (state.throttle * 80 + Math.random() * 20) / zoom;
      const flameGrad = ctx.createLinearGradient(0, rh/2, 0, rh/2 + flameH);
      flameGrad.addColorStop(0, '#fde047');
      flameGrad.addColorStop(0.4, '#f97316');
      flameGrad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-rw/2.2, rh/2);
      ctx.quadraticCurveTo(0, rh/2 + flameH * 1.2, rw/2.2, rh/2);
      ctx.fill();
    }

    // Rocket Body
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-rw/2, -rh/2, rw, rh);
    
    // Windows/Detail
    ctx.fillStyle = '#334155';
    ctx.fillRect(-rw/4, -rh/3, rw/2, rw/2);

    // Nose Cone
    ctx.beginPath();
    ctx.moveTo(-rw/2, -rh/2);
    ctx.lineTo(0, -rh/2 - (18/zoom));
    ctx.lineTo(rw/2, -rh/2);
    ctx.fillStyle = '#dc2626';
    ctx.fill();

    // Fins
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(-rw/2, rh/2);
    ctx.lineTo(-rw, rh/2 + (12/zoom));
    ctx.lineTo(-rw/2, rh/4);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(rw/2, rh/2);
    ctx.lineTo(rw, rh/2 + (12/zoom));
    ctx.lineTo(rw/2, rh/4);
    ctx.fill();

    ctx.restore();
  }, [state, stars]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950">
      <canvas 
        ref={canvasRef} 
        width={1200} 
        height={900} 
        className="w-full h-full block"
      />
      {/* UI Overlay on Canvas */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${state.isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></div>
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-tighter">Engine Core Link: {state.isPaused ? 'Standby' : 'Active'}</span>
        </div>
        <div className="text-[9px] text-white/30 font-mono">COORD_SYS: GEOCENTRIC_V2</div>
      </div>
    </div>
  );
};

export default SimulationView;
