import React, { useState, useEffect, useRef } from 'react';
import {
  Crown,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronRight,
} from 'lucide-react';
import { soundManager } from '../lib/audio';

interface Props {
  onComplete: (unlockedGoddess: boolean) => void;
  onSkip: () => void;
}

export function CinematicIntro({ onComplete, onSkip }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const [act, setAct] = useState<1 | 2 | 3 | 4>(1);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted());
  const [showContinueBtn, setShowContinueBtn] = useState(false);

  // Keep callback refs stable across renders
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;

  const stateRef = useRef({
    time: 0,
    birdX: 0,
    birdY: 0,
    hasCrashed: false,
    screenShake: 0,
    lastFlapTime: -1,
    crashAudioPlayed: false,
    divineAudioPlayed: false,
    laserAudioPlayed: false,
    currentAct: 1 as 1 | 2 | 3 | 4,
    continueBtnTriggered: false,
    particles: [] as Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
    }>,
  });

  const toggleAudio = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  const tryStartAudio = () => {
    soundManager.playRetroFlap();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    const st = stateRef.current;

    // Handle full-screen resizing
    const handleResize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Initial audio chirp
    soundManager.playRetroFlap();

    const TOTAL_DURATION = 11.2; // seconds

    const render = (now: number) => {
      // Calculate delta time
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      st.time += dt;

      // Update progress bar directly via DOM to avoid React re-renders
      if (progressBarRef.current) {
        const p = Math.min(100, (st.time / TOTAL_DURATION) * 100);
        progressBarRef.current.style.width = `${p}%`;
      }

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Handle screen shake
      if (st.screenShake > 0) {
        const sx = (Math.random() - 0.5) * st.screenShake;
        const sy = (Math.random() - 0.5) * st.screenShake;
        ctx.translate(sx, sy);
        st.screenShake = Math.max(0, st.screenShake - 30 * dt);
      }

      // Determine current Act without excessive re-renders
      let newAct: 1 | 2 | 3 | 4 = 1;
      if (st.time < 3.3) {
        newAct = 1;
      } else if (st.time < 6.8) {
        newAct = 2;
      } else if (st.time < 9.4) {
        newAct = 3;
      } else {
        newAct = 4;
        if (!st.continueBtnTriggered) {
          st.continueBtnTriggered = true;
          setShowContinueBtn(true);
        }
      }

      if (newAct !== st.currentAct) {
        st.currentAct = newAct;
        setAct(newAct);
      }

      // Auto-advance after 11.8s
      if (st.time >= 11.8) {
        ctx.restore();
        onCompleteRef.current(true);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // ==========================================
      // ACT 1: 2014 VINTAGE NOSTALGIA (0.0s - 3.3s)
      // ==========================================
      if (st.time < 3.3) {
        // Classic 2014 8-bit sky blue
        ctx.fillStyle = '#4EC0CA';
        ctx.fillRect(0, 0, width, height);

        const groundH = Math.max(70, height * 0.16);
        const groundY = height - groundH;

        // Vintage ground
        ctx.fillStyle = '#DDD894';
        ctx.fillRect(0, groundY, width, groundH);
        ctx.fillStyle = '#619B36';
        ctx.fillRect(0, groundY, width, 16);

        // Fluffy clouds floating across wide screen
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        const cloudOffsets = [0.15, 0.45, 0.78];
        cloudOffsets.forEach((ratio, idx) => {
          const cx = ((width * ratio - st.time * 24) % (width + 120) + width + 120) % (width + 120) - 60;
          const cy = height * 0.2 + (idx % 2) * 40;
          ctx.beginPath();
          ctx.arc(cx, cy, 28, 0, Math.PI * 2);
          ctx.arc(cx + 25, cy - 8, 38, 0, Math.PI * 2);
          ctx.arc(cx + 55, cy, 28, 0, Math.PI * 2);
          ctx.fill();
        });

        // Retro Green Pipe
        const pipeWidth = Math.min(80, width * 0.12);
        const pipeX = width * 0.68;
        const pipeGap = Math.max(130, height * 0.26);
        const pipeTopH = groundY * 0.45;
        const pipeBottomY = pipeTopH + pipeGap;

        // Draw vintage green pipe
        ctx.fillStyle = '#73BF2E';
        ctx.strokeStyle = '#548020';
        ctx.lineWidth = 3.5;

        // Top Pipe
        ctx.fillRect(pipeX, 0, pipeWidth, pipeTopH);
        ctx.strokeRect(pipeX, 0, pipeWidth, pipeTopH);
        ctx.fillRect(pipeX - 6, pipeTopH - 30, pipeWidth + 12, 30);
        ctx.strokeRect(pipeX - 6, pipeTopH - 30, pipeWidth + 12, 30);

        // Bottom Pipe
        ctx.fillRect(pipeX, pipeBottomY, pipeWidth, groundY - pipeBottomY);
        ctx.strokeRect(pipeX, pipeBottomY, pipeWidth, groundY - pipeBottomY);
        ctx.fillRect(pipeX - 6, pipeBottomY, pipeWidth + 12, 30);
        ctx.strokeRect(pipeX - 6, pipeBottomY, pipeWidth + 12, 30);

        // Pipe Highlights
        ctx.fillStyle = '#9FE858';
        ctx.fillRect(pipeX + 6, 0, 8, pipeTopH);
        ctx.fillRect(pipeX + 6, pipeBottomY, 8, groundY - pipeBottomY);

        // Retro Bird Movement
        if (!st.hasCrashed) {
          const startX = width * 0.12;
          const targetX = pipeX - 26;
          const moveProgress = Math.min(1, st.time / 2.7);
          st.birdX = startX + (targetX - startX) * moveProgress;
          st.birdY = (pipeTopH + pipeBottomY) / 2 + Math.sin(st.time * 7) * 25;

          // Sound triggers for flap
          const flapStep = Math.floor(st.time * 3.5);
          if (flapStep !== st.lastFlapTime && st.time < 2.6) {
            st.lastFlapTime = flapStep;
            soundManager.playRetroFlap();
          }

          // Check Crash Condition at ~2.7s
          if (st.time >= 2.7) {
            st.hasCrashed = true;
            if (!st.crashAudioPlayed) {
              st.crashAudioPlayed = true;
              soundManager.playRetroCrash();
            }
            st.screenShake = 22;
          }
        }

        // Draw 2014 Classic Yellow Pixel Bird
        ctx.save();
        ctx.translate(st.birdX, st.birdY);
        if (st.hasCrashed) {
          ctx.rotate(0.5);
        }

        const bScale = Math.min(1.4, Math.max(1.0, width / 700));
        ctx.scale(bScale, bScale);

        // Yellow body
        ctx.fillStyle = '#F8B800';
        ctx.strokeStyle = '#D84800';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // White belly
        ctx.fillStyle = '#FFF0A0';
        ctx.beginPath();
        ctx.arc(-2, 4, 11, 0, Math.PI * 2);
        ctx.fill();

        // Classic Eye
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(8, -6, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(10, -6, 3, 0, Math.PI * 2);
        ctx.fill();

        // Orange Beak
        ctx.fillStyle = '#F85800';
        ctx.strokeStyle = '#D84800';
        ctx.beginPath();
        ctx.ellipse(16, 2, 9, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Flapping Wing
        ctx.fillStyle = '#FFF8D8';
        ctx.beginPath();
        ctx.ellipse(-10, 2, 8, 5, st.hasCrashed ? 0.7 : Math.sin(st.time * 14) * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Subtle CRT scanlines
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        for (let y = 0; y < height; y += 4) {
          ctx.fillRect(0, y, width, 1.5);
        }

        // Crash Glitch Alert Message
        if (st.hasCrashed) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
          ctx.fillRect(0, 0, width, height);

          ctx.textAlign = 'center';
          ctx.font = '900 clamp(20px, 4vw, 36px) monospace';
          ctx.fillStyle = '#EF4444';
          ctx.shadowColor = '#EF4444';
          ctx.shadowBlur = 18;
          ctx.fillText('CRITICAL IMPACT DETECTED', width / 2, height * 0.4);
          ctx.font = 'bold clamp(12px, 2vw, 18px) monospace';
          ctx.fillStyle = '#FCA5A5';
          ctx.fillText('HISTORICAL ARCHIVE: FLIGHT TERMINATED', width / 2, height * 0.4 + 35);
          ctx.fillText('FOR 15 YEARS, WE THOUGHT THE GAME WAS OVER...', width / 2, height * 0.4 + 65);
          ctx.textAlign = 'left';
        }
      }

      // ==========================================
      // ACT 2: QUANTUM DEIFICATION (3.3s - 6.8s)
      // ==========================================
      else if (st.time < 6.8) {
        if (!st.divineAudioPlayed) {
          st.divineAudioPlayed = true;
          soundManager.playDivineBassDrop();
          soundManager.playDivineChoirChord();
          st.screenShake = 14;
        }

        // Deep Cosmic Void
        ctx.fillStyle = '#030510';
        ctx.fillRect(0, 0, width, height);

        // Full-screen Perspective Cyber Grid
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.lineWidth = 1.2;
        const gridStep = Math.max(30, width / 28);
        for (let x = 0; x < width; x += gridStep) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridStep) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        const centerX = width / 2;
        const centerY = height / 2;
        const ringProgress = (st.time - 3.3) / 3.5;

        // Concentric Holographic Resonator Rings
        ctx.save();
        ctx.translate(centerX, centerY);

        // Outer Ring
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, 100 + ringProgress * 70, 0, Math.PI * 2);
        ctx.stroke();

        // Inner Rotating Quantum Ring
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = 18;
        ctx.setLineDash([20, 14]);
        ctx.rotate(st.time * 2.2);
        ctx.beginPath();
        ctx.arc(0, 0, 75, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // The Awakening Goddess Bird Formation
        ctx.save();
        ctx.translate(centerX, centerY + Math.sin(st.time * 4) * 8);

        const goddessScale = Math.min(1.8, Math.max(1.2, width / 650));
        ctx.scale(goddessScale, goddessScale);

        // Radiant Golden Astral Halo
        ctx.strokeStyle = '#FFE066';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.ellipse(0, -36, 32, 9, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Halo Jewel Core
        ctx.fillStyle = '#00F0FF';
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, -36, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Central Cyber Goddess Vessel
        ctx.fillStyle = '#1A1423';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 36, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Celestial Cyan Visor
        ctx.fillStyle = '#00F0FF';
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.ellipse(14, -4, 14, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Golden Feathered Cyber Wings Spreading Wide
        const wingSpan = Math.min(1.5, 0.4 + ringProgress * 1.1);
        ctx.save();
        ctx.scale(wingSpan, wingSpan);
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 22;

        // Left Wing
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(-55, -34);
        ctx.lineTo(-36, 12);
        ctx.closePath();
        ctx.fill();

        // Right Wing
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(55, -34);
        ctx.lineTo(36, 12);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.restore();

        // Epic Text Readout
        ctx.textAlign = 'center';
        ctx.font = '900 clamp(18px, 3.5vw, 32px) monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        ctx.fillText('MORTAL RESTRAINTS PURGED', centerX, height * 0.82);

        ctx.font = 'bold clamp(12px, 2vw, 18px) monospace';
        ctx.fillStyle = '#FDE047';
        ctx.fillText('AETHELIA // GODDESS OF GAMES AWAKENS', centerX, height * 0.82 + 32);
        ctx.textAlign = 'left';
      }

      // ==========================================
      // ACT 3: OBLITERATING THE OBSTACLE (6.8s - 9.4s)
      // ==========================================
      else if (st.time < 9.4) {
        if (!st.laserAudioPlayed) {
          st.laserAudioPlayed = true;
          soundManager.playObliterationBlast();
          st.screenShake = 22;
        }

        // Dark Atmospheric Space
        ctx.fillStyle = '#07050F';
        ctx.fillRect(0, 0, width, height);

        // Grid
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.12)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        const birdX = width * 0.22;
        const birdY = height / 2;
        const targetPipeX = width * 0.78;

        // Draw The Goddess Bird
        ctx.save();
        ctx.translate(birdX, birdY);
        const gScale = Math.min(1.8, Math.max(1.2, width / 650));
        ctx.scale(gScale, gScale);

        // Halo
        ctx.strokeStyle = '#FFE066';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.ellipse(0, -32, 28, 8, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Hull
        ctx.fillStyle = '#1A1423';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 36, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Visor
        ctx.fillStyle = '#00F0FF';
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.ellipse(15, -4, 14, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // THE COLOSSAL CELESTIAL BEAM
        ctx.save();
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = Math.min(26, width * 0.04);
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.moveTo(birdX + 35, birdY - 4);
        ctx.lineTo(targetPipeX, birdY - 4);
        ctx.stroke();

        // White Core Laser
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = Math.min(12, width * 0.018);
        ctx.beginPath();
        ctx.moveTo(birdX + 35, birdY - 4);
        ctx.lineTo(targetPipeX, birdY - 4);
        ctx.stroke();
        ctx.restore();

        // Shattered Pipe Stardust Particles
        if (st.particles.length === 0) {
          for (let i = 0; i < 90; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 70 + Math.random() * 260;
            st.particles.push({
              x: targetPipeX,
              y: birdY + (Math.random() - 0.5) * 120,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              size: 3 + Math.random() * 6,
              color: Math.random() > 0.4 ? '#73BF2E' : '#FFD700',
              alpha: 1.0,
            });
          }
        }

        // Draw and update particles
        st.particles.forEach((p) => {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.alpha = Math.max(0, p.alpha - 0.65 * dt);
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 12;
          ctx.fillRect(p.x, p.y, p.size, p.size);
          ctx.restore();
        });

        // Kinetic typography
        ctx.textAlign = 'center';
        ctx.font = '900 clamp(20px, 4vw, 36px) monospace';
        ctx.fillStyle = '#EF4444';
        ctx.shadowColor = '#EF4444';
        ctx.shadowBlur = 18;
        ctx.fillText('NO MORE FALLING.', width / 2, height * 0.16);

        ctx.font = '900 clamp(24px, 5vw, 44px) monospace';
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 24;
        ctx.fillText('NOW... WE RULE THE SKIES.', width / 2, height * 0.16 + 45);
        ctx.textAlign = 'left';
      }

      // ==========================================
      // ACT 4: TITLE SMASH & ASCENSION (9.4s - 11.8s)
      // ==========================================
      else {
        // Deep Obsidian Neon Stage
        ctx.fillStyle = '#05030A';
        ctx.fillRect(0, 0, width, height);

        // Radiant Celestial Sun
        const centerX = width / 2;
        const centerY = height * 0.38;

        const grad = ctx.createRadialGradient(
          centerX,
          centerY,
          10,
          centerX,
          centerY,
          width * 0.45
        );
        grad.addColorStop(0, 'rgba(255, 215, 0, 0.25)');
        grad.addColorStop(0.5, 'rgba(0, 240, 255, 0.1)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Rotating Rings Around Goddess
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(st.time * 0.8);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([16, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, 85, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#00F0FF';
        ctx.rotate(-st.time * 1.6);
        ctx.beginPath();
        ctx.arc(0, 0, 60, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Goddess Floating Emblem
        ctx.save();
        ctx.translate(centerX, centerY + Math.sin(st.time * 3) * 5);
        const gScale = Math.min(1.6, Math.max(1.1, width / 700));
        ctx.scale(gScale, gScale);

        // Halo
        ctx.strokeStyle = '#FFE066';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.ellipse(0, -32, 28, 8, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Hull
        ctx.fillStyle = '#1A1423';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 32, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Visor
        ctx.fillStyle = '#00F0FF';
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.ellipse(12, -4, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Massive Graphic Designer Title
        ctx.textAlign = 'center';
        ctx.font = '900 clamp(26px, 6vw, 54px) monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = 25;
        ctx.fillText('CYBER FLAP 2099', centerX, height * 0.62);

        ctx.font = '900 clamp(14px, 3vw, 24px) monospace';
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 18;
        ctx.fillText('REBIRTH OF THE GODDESS', centerX, height * 0.62 + 36);

        ctx.font = 'bold clamp(11px, 2vw, 15px) monospace';
        ctx.fillStyle = '#38BDF8';
        ctx.shadowBlur = 0;
        ctx.fillText('✦ CELESTIAL DEITY STATUS UNLOCKED ✦', centerX, height * 0.62 + 66);
        ctx.textAlign = 'left';
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Run on mount only - callbacks referenced via refs

  return (
    <div
      id="cinematic-intro-fullscreen"
      className="fixed inset-0 w-screen h-screen z-50 bg-black overflow-hidden select-none flex flex-col font-mono"
      onClick={tryStartAudio}
    >
      {/* Full-Screen Crisp Canvas - Zero Blur */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-pointer"
      />

      {/* Floating Non-Intrusive Top Controls */}
      <div className="absolute top-4 inset-x-4 sm:inset-x-6 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleAudio}
            className="px-3 py-1.5 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span className="hidden sm:inline">{isMuted ? 'MUTED' : 'AUDIO ON'}</span>
          </button>

          <div className="px-3 py-1.5 rounded-full bg-slate-950/80 border border-amber-500/40 text-amber-300 text-xs font-black hidden sm:flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {act === 1 && 'HISTORICAL ARCHIVE: 2014'}
              {act === 2 && 'QUANTUM TRANSMUTATION'}
              {act === 3 && 'OBSTACLE ANNIHILATION'}
              {act === 4 && 'GODDESS ASCENSION'}
            </span>
          </div>
        </div>

        {/* Skip to Cockpit Button */}
        <div className="pointer-events-auto">
          <button
            id="intro-skip-fullscreen-btn"
            onClick={() => onSkipRef.current()}
            className="px-4 py-2 rounded-full bg-slate-950/90 hover:bg-slate-900 text-amber-300 hover:text-white border-2 border-amber-400/60 hover:border-amber-400 text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.35)] active:scale-95"
          >
            <span>SKIP INTRO</span>
            <SkipForward className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Floating Bottom Action Prompt at Act 4 */}
      {showContinueBtn && (
        <div className="absolute bottom-8 inset-x-4 flex justify-center z-10 pointer-events-auto animate-in fade-in zoom-in-95 duration-300">
          <button
            id="intro-continue-to-menu-btn"
            onClick={() => onCompleteRef.current(true)}
            className="py-3.5 px-6 sm:px-8 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-slate-950 font-black rounded-2xl uppercase text-xs sm:text-sm tracking-wider transition-all duration-200 shadow-[0_0_35px_rgba(245,158,11,0.6)] flex items-center gap-2.5 cursor-pointer active:scale-95 hover:scale-102"
          >
            <Crown className="w-4 h-4 fill-current text-slate-950" />
            <span>CONTINUE TO INTRO PORTAL</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Minimalist Bottom Timeline Progress Bar */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-900 pointer-events-none">
        <div
          ref={progressBarRef}
          className="bg-gradient-to-r from-amber-400 via-cyan-400 to-amber-400 h-full transition-all duration-75 shadow-[0_0_12px_#F59E0B]"
          style={{ width: '0%' }}
        />
      </div>
    </div>
  );
}
