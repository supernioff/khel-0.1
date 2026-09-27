import type { CyberThemeId } from '../types/game';
import type { SectorColorStage } from './themes';

/**
 * Modern High-Fidelity Thematic Background Engine
 * Renders distinct, living, and visually captivating environments for each theme.
 */

// Helper to draw stars / cosmic dust
function drawStarfield(
  ctx: CanvasRenderingContext2D,
  vWidth: number,
  playableHeight: number,
  curOffsetY: number,
  timestamp: number,
  starCount = 35,
  tint = '#FFFFFF'
) {
  ctx.save();
  ctx.fillStyle = tint;
  for (let s = 0; s < starCount; s++) {
    const sx = (s * 97 + timestamp * 0.015) % vWidth;
    const sy = (s * 43 - curOffsetY * 0.4) % (playableHeight - 70);
    const twinkle = 0.2 + (Math.sin(timestamp * 0.0025 + s * 1.7) + 1) * 0.35;
    ctx.globalAlpha = Math.min(1, Math.max(0.1, twinkle));
    const size = s % 4 === 0 ? 2.5 : s % 2 === 0 ? 1.8 : 1.2;
    ctx.fillRect(sx, sy, size, size);
  }
  ctx.restore();
}

/**
 * 1. SYNTHWAVE SUNSET
 * Retro 80s wireframe sun with scanlines, low-poly parallax mountains, shooting stars, and palm silhouettes.
 */
function drawSynthwave(
  ctx: CanvasRenderingContext2D,
  vWidth: number,
  playableHeight: number,
  curOffsetY: number,
  timestamp: number,
  bgOffset: number,
  curTheme: SectorColorStage
) {
  // Twinkling stars
  drawStarfield(ctx, vWidth, playableHeight, curOffsetY, timestamp, 45, '#FDE047');

  // Shooting star with trail
  const shootingStarPeriod = (timestamp * 0.0004) % 1;
  if (shootingStarPeriod < 0.35) {
    const progress = shootingStarPeriod / 0.35;
    const startX = (vWidth * 0.8) - progress * (vWidth * 0.6);
    const startY = -curOffsetY + 20 + progress * 140;
    ctx.save();
    const starGrad = ctx.createLinearGradient(startX + 60, startY - 30, startX, startY);
    starGrad.addColorStop(0, 'rgba(244, 63, 94, 0)');
    starGrad.addColorStop(1, 'rgba(253, 224, 71, 0.9)');
    ctx.strokeStyle = starGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX + 60, startY - 30);
    ctx.lineTo(startX, startY);
    ctx.stroke();
    ctx.restore();
  }

  // Giant 80s Retro Wireframe Sun
  const sunX = vWidth * 0.5;
  const sunY = playableHeight - 80;
  const sunRadius = Math.min(85, Math.max(65, vWidth * 0.12));

  ctx.save();
  // Radiant Sun Glow
  const sunHalo = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.4, sunX, sunY, sunRadius * 1.8);
  sunHalo.addColorStop(0, 'rgba(244, 63, 94, 0.55)');
  sunHalo.addColorStop(0.5, 'rgba(245, 158, 11, 0.25)');
  sunHalo.addColorStop(1, 'rgba(24, 2, 43, 0)');
  ctx.fillStyle = sunHalo;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // The Sun Disk with gradient
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.clip();

  const sunGrad = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
  sunGrad.addColorStop(0, '#FEF08A'); // bright yellow
  sunGrad.addColorStop(0.45, '#F59E0B'); // amber
  sunGrad.addColorStop(0.75, '#F43F5E'); // hot pink
  sunGrad.addColorStop(1, '#9333EA'); // violet base
  ctx.fillStyle = sunGrad;
  ctx.fillRect(sunX - sunRadius, sunY - sunRadius, sunRadius * 2, sunRadius * 2);

  // Horizontal Outrun scanline slashes (cutting through the lower 60% of the sun)
  const lineCount = 8;
  for (let i = 0; i < lineCount; i++) {
    const factor = i / lineCount;
    const lineY = sunY - sunRadius * 0.15 + factor * (sunRadius * 1.15);
    const lineHeight = 2.5 + factor * 5; // lines get thicker toward the bottom
    ctx.fillStyle = curTheme.skyBottom;
    ctx.fillRect(sunX - sunRadius - 10, lineY, (sunRadius + 10) * 2, lineHeight);
  }
  ctx.restore();
  ctx.restore();

  // Parallax Layer 1: Far Mountain Silhouettes
  const farOffset = (bgOffset * 0.18) % 360;
  ctx.save();
  ctx.fillStyle = '#1D0633';
  ctx.strokeStyle = '#D946EF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-40, playableHeight);
  for (let x = -40; x <= vWidth + 40; x += 60) {
    const peakIdx = Math.floor((x + farOffset) / 60);
    const peakHeight = 45 + Math.sin(peakIdx * 3.7) * 30 + Math.cos(peakIdx * 1.3) * 20;
    ctx.lineTo(x, playableHeight - peakHeight);
  }
  ctx.lineTo(vWidth + 40, playableHeight);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Parallax Layer 2: Near Wireframe Low-Poly Mountain Ridges
  const nearOffset = (bgOffset * 0.45) % 280;
  ctx.save();
  ctx.fillStyle = '#110222';
  ctx.strokeStyle = '#F43F5E';
  ctx.shadowColor = '#F43F5E';
  ctx.shadowBlur = 8;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-30, playableHeight);
  for (let x = -30; x <= vWidth + 40; x += 45) {
    const peakIdx = Math.floor((x + nearOffset) / 45);
    const peakHeight = 65 + Math.sin(peakIdx * 4.9) * 40 + Math.cos(peakIdx * 2.1) * 25;
    ctx.lineTo(x, playableHeight - peakHeight);
  }
  ctx.lineTo(vWidth + 40, playableHeight);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Retro horizon warm glow bar
  ctx.save();
  const horizGrad = ctx.createLinearGradient(0, playableHeight - 35, 0, playableHeight);
  horizGrad.addColorStop(0, 'rgba(244, 63, 94, 0)');
  horizGrad.addColorStop(1, 'rgba(244, 63, 94, 0.4)');
  ctx.fillStyle = horizGrad;
  ctx.fillRect(0, playableHeight - 35, vWidth, 35);
  ctx.restore();
}

/**
 * 2. MATRIX DIGITAL
 * Cascading digital green code rain streams, floating holographic mainframe data cubes, and glowing PCB circuit pathways.
 */
function drawMatrix(
  ctx: CanvasRenderingContext2D,
  vWidth: number,
  playableHeight: number,
  curOffsetY: number,
  timestamp: number,
  bgOffset: number,
  curTheme: SectorColorStage
) {
  const glyphs = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾎﾏﾐﾑﾒﾓ0123456789ABCDEF';
  const columnWidth = 24;
  const colCount = Math.ceil(vWidth / columnWidth) + 1;

  ctx.save();
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';

  // Cascading code rain
  for (let i = 0; i < colCount; i++) {
    const colX = i * columnWidth;
    const speed = 0.08 + (i % 5) * 0.04;
    const streamLen = 14 + (i % 8);
    const headY = ((timestamp * speed + i * 73) % (playableHeight + 250)) - curOffsetY;

    for (let j = 0; j < streamLen; j++) {
      const charY = headY - j * 15;
      if (charY < -curOffsetY - 20 || charY > playableHeight) continue;

      const charIdx = Math.floor((i * 17 + j * 7 + Math.floor(timestamp * 0.01)) % glyphs.length);
      const char = glyphs[charIdx];

      if (j === 0) {
        // Head glow: ultra bright white-mint
        ctx.fillStyle = '#E6FFFA';
        ctx.shadowColor = '#10B981';
        ctx.shadowBlur = 10;
        ctx.fillText(char, colX, charY);
        ctx.shadowBlur = 0;
      } else {
        const alpha = Math.max(0.05, 1 - j / streamLen);
        ctx.fillStyle = j < 3 ? '#34D399' : '#059669';
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillText(char, colX, charY);
      }
    }
  }
  ctx.restore();

  // Floating Isometric Mainframe Data Cubes
  const cubeCount = 3;
  ctx.save();
  for (let c = 0; c < cubeCount; c++) {
    const cubeX = ((c * (vWidth * 0.35) + timestamp * 0.02 - bgOffset * 0.2) % (vWidth + 100)) - 50;
    const cubeY = 110 + c * 80 + Math.sin(timestamp * 0.002 + c * 2) * 15;
    const cubeSize = 22 + c * 6;
    const angle = timestamp * 0.0012 + c * 1.5;

    ctx.save();
    ctx.translate(cubeX, cubeY);
    ctx.rotate(angle);
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 1.4;
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 8;
    ctx.strokeRect(-cubeSize / 2, -cubeSize / 2, cubeSize, cubeSize);

    // Inner wireframe diagonal
    ctx.beginPath();
    ctx.moveTo(-cubeSize / 2, -cubeSize / 2);
    ctx.lineTo(cubeSize / 2, cubeSize / 2);
    ctx.moveTo(cubeSize / 2, -cubeSize / 2);
    ctx.lineTo(-cubeSize / 2, cubeSize / 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // Glowing Cyber Sub-Horizon PCB Circuit Board Traces
  ctx.save();
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
  ctx.lineWidth = 1.5;
  const circuitY = playableHeight - 20;
  for (let x = 0; x < vWidth + 80; x += 70) {
    const offsetTrace = (x - bgOffset * 0.3) % (vWidth + 80);
    ctx.beginPath();
    ctx.moveTo(offsetTrace, circuitY + 15);
    ctx.lineTo(offsetTrace + 25, circuitY - 15);
    ctx.lineTo(offsetTrace + 55, circuitY - 15);
    ctx.stroke();

    // Solder node
    ctx.fillStyle = '#34D399';
    ctx.beginPath();
    ctx.arc(offsetTrace + 55, circuitY - 15, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 3. NEO CYBERPUNK
 * Towering Blade-Runner mega-skyscrapers, neon holographic billboards (NEO TOKYO, CYBERPUNK, WARP),
 * flying vehicle sky-lane light trails, and volumetric sweeping searchlights.
 */
function drawCyberpunk(
  ctx: CanvasRenderingContext2D,
  vWidth: number,
  playableHeight: number,
  curOffsetY: number,
  timestamp: number,
  bgOffset: number,
  curTheme: SectorColorStage
) {
  drawStarfield(ctx, vWidth, playableHeight, curOffsetY, timestamp, 28, '#00F0FF');

  // Layer 1: Distant Megastructures & Monoliths
  const farOffset = (bgOffset * 0.2) % 450;
  ctx.save();
  ctx.fillStyle = '#060A17';
  for (let x = -farOffset; x < vWidth + 200; x += 150) {
    // Huge pyramid / monolith tower
    ctx.beginPath();
    ctx.moveTo(x, playableHeight);
    ctx.lineTo(x + 30, playableHeight - 220);
    ctx.lineTo(x + 90, playableHeight - 220);
    ctx.lineTo(x + 120, playableHeight);
    ctx.fill();

    // Red warning beacon at apex
    const blink = Math.sin(timestamp * 0.005 + x) > 0;
    if (blink) {
      ctx.fillStyle = '#EF4444';
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 10;
      ctx.fillRect(x + 58, playableHeight - 225, 4, 4);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#060A17';
    }
  }
  ctx.restore();

  // Layer 2: Sweeping Atmospheric Searchlights
  ctx.save();
  const searchlightAngle = Math.sin(timestamp * 0.001) * 0.45;
  const beamX1 = ((vWidth * 0.25 - bgOffset * 0.25) % vWidth + vWidth) % vWidth;
  const beamX2 = ((vWidth * 0.75 - bgOffset * 0.25) % vWidth + vWidth) % vWidth;

  [beamX1, beamX2].forEach((bx, idx) => {
    const angle = searchlightAngle * (idx === 0 ? 1 : -1) - 0.25;
    const targetX = bx + Math.sin(angle) * 360;
    const targetY = -curOffsetY - 40;

    const beamGrad = ctx.createLinearGradient(bx, playableHeight - 120, targetX, targetY);
    beamGrad.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
    beamGrad.addColorStop(0.8, 'rgba(0, 240, 255, 0.03)');
    beamGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(bx - 12, playableHeight - 120);
    ctx.lineTo(bx + 12, playableHeight - 120);
    ctx.lineTo(targetX + 65, targetY);
    ctx.lineTo(targetX - 65, targetY);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();

  // Layer 3: Mid-Ground Skyscrapers with Windows & Neon Billboards
  const midOffset = (bgOffset * 0.5) % 360;
  const midBuildings = [
    { w: 55, h: 170, billboard: 'NEO TOKYO', color: '#00F0FF' },
    { w: 42, h: 120, billboard: null, color: '#FF007F' },
    { w: 70, h: 200, billboard: 'CYBERPUNK', color: '#FF007F' },
    { w: 48, h: 140, billboard: null, color: '#00F0FF' },
    { w: 65, h: 185, billboard: 'WARP 2077', color: '#00F0FF' },
  ];

  ctx.save();
  let curBx = -midOffset;
  let bIdx = 0;
  while (curBx < vWidth + 140) {
    const b = midBuildings[bIdx % midBuildings.length];
    const bTop = playableHeight - b.h;

    // Building body
    ctx.fillStyle = '#090D1C';
    ctx.fillRect(curBx, bTop, b.w, b.h);

    // Edges & Spire
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(curBx, bTop, b.w, b.h);

    // Rooftop antenna with blinking node
    ctx.beginPath();
    ctx.moveTo(curBx + b.w / 2, bTop);
    ctx.lineTo(curBx + b.w / 2, bTop - 18);
    ctx.stroke();

    // Holographic Billboard
    if (b.billboard) {
      const billY = bTop + 25;
      ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
      ctx.fillRect(curBx + 4, billY, b.w - 8, 22);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(curBx + 4, billY, b.w - 8, 22);

      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = b.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 6;
      ctx.fillText(b.billboard, curBx + b.w / 2, billY + 14);
      ctx.shadowBlur = 0;
    }

    // Window matrix
    ctx.fillStyle = bIdx % 2 === 0 ? 'rgba(0, 240, 255, 0.35)' : 'rgba(255, 0, 127, 0.35)';
    for (let r = b.billboard ? 55 : 20; r < b.h - 15; r += 16) {
      ctx.fillRect(curBx + 8, bTop + r, 5, 7);
      if (b.w > 45) ctx.fillRect(curBx + b.w - 14, bTop + r, 5, 7);
    }

    curBx += b.w + 14;
    bIdx++;
  }
  ctx.restore();

  // Flying Skycar Traffic Lanes (horizontal streaks)
  ctx.save();
  const carLaneY = playableHeight - 85;
  const laneSpeed = timestamp * 0.25;
  for (let c = 0; c < 5; c++) {
    // Red taillights going left
    const carX = ((c * 180 - laneSpeed) % (vWidth + 100) + (vWidth + 100)) % (vWidth + 100) - 50;
    ctx.strokeStyle = '#EF4444';
    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(carX, carLaneY + (c % 2) * 8);
    ctx.lineTo(carX + 22, carLaneY + (c % 2) * 8);
    ctx.stroke();

    // Cyan headlights going right
    const carX2 = (c * 210 + laneSpeed * 1.3) % (vWidth + 100) - 50;
    ctx.strokeStyle = '#00F0FF';
    ctx.shadowColor = '#00F0FF';
    ctx.beginPath();
    ctx.moveTo(carX2, carLaneY + 16 + (c % 2) * 6);
    ctx.lineTo(carX2 - 25, carLaneY + 16 + (c % 2) * 6);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 4. QUANTUM VOID
 * Supermassive Black Hole with glowing relativistic plasma accretion disk, gravitational lensing ring,
 * orbiting gas giant with celestial rings, cosmic dust nebulae, and stellar constellations.
 */
function drawVoid(
  ctx: CanvasRenderingContext2D,
  vWidth: number,
  playableHeight: number,
  curOffsetY: number,
  timestamp: number,
  bgOffset: number,
  curTheme: SectorColorStage
) {
  drawStarfield(ctx, vWidth, playableHeight, curOffsetY, timestamp, 60, '#C7D2FE');

  // Multi-layered Cosmic Nebulae (plasma clouds)
  ctx.save();
  const nebGrad = ctx.createRadialGradient(
    vWidth * 0.3,
    playableHeight * 0.35,
    20,
    vWidth * 0.3,
    playableHeight * 0.35,
    180
  );
  nebGrad.addColorStop(0, 'rgba(129, 140, 248, 0.28)');
  nebGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.15)');
  nebGrad.addColorStop(1, 'rgba(11, 10, 38, 0)');
  ctx.fillStyle = nebGrad;
  ctx.beginPath();
  ctx.arc(vWidth * 0.3, playableHeight * 0.35, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Supermassive Quantum Black Hole
  const bhX = vWidth * 0.65;
  const bhY = playableHeight * 0.45;
  const bhRadius = Math.min(60, vWidth * 0.09);

  ctx.save();
  // 1. Relativistic Polar Jet Columns (Vertical ion streams)
  const jetGrad = ctx.createLinearGradient(bhX, bhY - 140, bhX, bhY + 140);
  jetGrad.addColorStop(0, 'rgba(129, 140, 248, 0)');
  jetGrad.addColorStop(0.4, 'rgba(192, 132, 252, 0.7)');
  jetGrad.addColorStop(0.6, 'rgba(192, 132, 252, 0.7)');
  jetGrad.addColorStop(1, 'rgba(129, 140, 248, 0)');
  ctx.strokeStyle = jetGrad;
  ctx.lineWidth = 3;
  ctx.shadowColor = '#818CF8';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(bhX, bhY - 140);
  ctx.lineTo(bhX, bhY + 140);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 2. Gravitational Lensing Halo (Top arc)
  ctx.save();
  ctx.translate(bhX, bhY);
  ctx.rotate(-0.25);
  ctx.strokeStyle = 'rgba(224, 231, 255, 0.65)';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#818CF8';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.ellipse(0, 0, bhRadius * 1.5, bhRadius * 0.55, 0, Math.PI, 0);
  ctx.stroke();
  ctx.restore();

  // 3. The Swirling Accretion Disk (Tilted glowing ellipse)
  ctx.save();
  ctx.translate(bhX, bhY);
  ctx.rotate(-0.25);
  const diskGrad = ctx.createRadialGradient(0, 0, bhRadius * 0.8, 0, 0, bhRadius * 2.1);
  diskGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  diskGrad.addColorStop(0.3, 'rgba(192, 132, 252, 0.8)');
  diskGrad.addColorStop(0.7, 'rgba(129, 140, 248, 0.5)');
  diskGrad.addColorStop(1, 'rgba(11, 10, 38, 0)');
  ctx.fillStyle = diskGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, bhRadius * 2.1, bhRadius * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 4. Pitch-Black Event Horizon
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(bhX, bhY, bhRadius, 0, Math.PI * 2);
  ctx.fill();

  // 5. Blazing White Photon Ring Edge
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.8;
  ctx.shadowColor = '#C084FC';
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.restore();

  // Distant Ringed Gas Giant in Left Sky
  const planetX = vWidth * 0.18;
  const planetY = 90 - curOffsetY * 0.2;
  const pRadius = 24;
  ctx.save();
  // Planet body
  const planetGrad = ctx.createLinearGradient(planetX - pRadius, planetY - pRadius, planetX + pRadius, planetY + pRadius);
  planetGrad.addColorStop(0, '#6366F1');
  planetGrad.addColorStop(1, '#1E1B4B');
  ctx.fillStyle = planetGrad;
  ctx.beginPath();
  ctx.arc(planetX, planetY, pRadius, 0, Math.PI * 2);
  ctx.fill();

  // Planet Rings
  ctx.strokeStyle = 'rgba(165, 180, 252, 0.7)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(planetX, planetY, pRadius * 2.2, pRadius * 0.45, -0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * 5. SOLAR FLARE OUTPOST
 * Massive burning solar star with turbulent coronal prominence loops, Martian basalt crater canyons,
 * orbital solar harvester satellite, and drifting heat embers.
 */
function drawSolar(
  ctx: CanvasRenderingContext2D,
  vWidth: number,
  playableHeight: number,
  curOffsetY: number,
  timestamp: number,
  bgOffset: number,
  curTheme: SectorColorStage
) {
  // Drifting solar ember particles
  ctx.save();
  ctx.fillStyle = '#FF922B';
  for (let s = 0; s < 30; s++) {
    const ex = (s * 83 - timestamp * 0.035) % vWidth;
    const ey = (s * 53 + Math.sin(timestamp * 0.003 + s) * 20 - curOffsetY * 0.5) % (playableHeight - 50);
    const alpha = 0.3 + (Math.sin(timestamp * 0.004 + s * 2) + 1) * 0.3;
    ctx.globalAlpha = Math.max(0.1, alpha);
    ctx.fillRect((ex + vWidth) % vWidth, (ey + playableHeight) % playableHeight, 2, 2);
  }
  ctx.restore();

  // Colossal Burning Solar Sun
  const sunX = vWidth * 0.28;
  const sunY = -curOffsetY + 70;
  const sunRadius = Math.min(105, vWidth * 0.15);

  ctx.save();
  // Coronal Solar Glow
  const coronaGrad = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.5, sunX, sunY, sunRadius * 2.2);
  coronaGrad.addColorStop(0, 'rgba(255, 107, 0, 0.8)');
  coronaGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.35)');
  coronaGrad.addColorStop(1, 'rgba(36, 6, 0, 0)');
  ctx.fillStyle = coronaGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Turbulent Coronal Flare Loops (Solar Prominences)
  const flarePulse = Math.sin(timestamp * 0.003) * 12;
  ctx.strokeStyle = '#FFA94D';
  ctx.lineWidth = 3.5;
  ctx.shadowColor = '#FF6B00';
  ctx.shadowBlur = 15;
  // Prominence loop 1
  ctx.beginPath();
  ctx.moveTo(sunX + sunRadius * 0.8, sunY);
  ctx.quadraticCurveTo(sunX + sunRadius * 1.5 + flarePulse, sunY - 40, sunX + sunRadius * 0.6, sunY - sunRadius * 0.7);
  ctx.stroke();
  // Prominence loop 2
  ctx.beginPath();
  ctx.moveTo(sunX - sunRadius * 0.7, sunY - sunRadius * 0.5);
  ctx.quadraticCurveTo(sunX - sunRadius * 1.4 - flarePulse, sunY - 80, sunX - sunRadius * 0.2, sunY - sunRadius * 0.95);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // The Solar Core Disk
  const coreGrad = ctx.createRadialGradient(sunX - 25, sunY - 25, 10, sunX, sunY, sunRadius);
  coreGrad.addColorStop(0, '#FFF3BF'); // blistering white gold
  coreGrad.addColorStop(0.3, '#FFD43B'); // bright yellow
  coreGrad.addColorStop(0.7, '#FF6B00'); // orange
  coreGrad.addColorStop(1, '#C92A2A'); // deep red boundary
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Parallax Martian Basalt Canyons & Crater Ridges
  const canyonOffset = (bgOffset * 0.35) % 320;
  ctx.save();
  ctx.fillStyle = '#2B0A02';
  ctx.strokeStyle = '#E8590C';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-40, playableHeight);
  for (let x = -40; x <= vWidth + 40; x += 50) {
    const rIdx = Math.floor((x + canyonOffset) / 50);
    const ridgeH = 50 + Math.sin(rIdx * 3.4) * 35 + Math.cos(rIdx * 1.8) * 20;
    ctx.lineTo(x, playableHeight - ridgeH);
  }
  ctx.lineTo(vWidth + 40, playableHeight);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Floating Orbital Solar Harvester Satellite
  const satX = ((vWidth * 0.75 - bgOffset * 0.15) % vWidth + vWidth) % vWidth;
  const satY = 120 - curOffsetY * 0.2;
  ctx.save();
  ctx.translate(satX, satY);
  ctx.fillStyle = '#1C1917';
  ctx.strokeStyle = '#FF6B00';
  ctx.lineWidth = 1.2;
  // Core module
  ctx.fillRect(-10, -6, 20, 12);
  ctx.strokeRect(-10, -6, 20, 12);
  // Solar panels wings
  ctx.fillStyle = '#0284C7';
  ctx.fillRect(-35, -4, 22, 8);
  ctx.fillRect(13, -4, 22, 8);
  ctx.strokeRect(-35, -4, 22, 8);
  ctx.strokeRect(13, -4, 22, 8);
  ctx.restore();
}

/**
 * 6. ARCTIC AURORA
 * Breathtaking flowing ribbons of northern lights (emerald, cyan, violet), crystalline ice spires,
 * frosted mountain peaks, and drifting cryo snow embers.
 */
function drawAurora(
  ctx: CanvasRenderingContext2D,
  vWidth: number,
  playableHeight: number,
  curOffsetY: number,
  timestamp: number,
  bgOffset: number,
  curTheme: SectorColorStage
) {
  drawStarfield(ctx, vWidth, playableHeight, curOffsetY, timestamp, 40, '#E0F2FE');

  // Wavy Aurora Borealis Curtains (3 undulating ribbons)
  ctx.save();
  const ribbons = [
    { baseY: 80, amp: 40, freq: 0.005, speed: 0.0008, color1: 'rgba(56, 217, 169, 0.45)', color2: 'rgba(32, 201, 151, 0)' },
    { baseY: 130, amp: 55, freq: 0.007, speed: -0.0011, color1: 'rgba(0, 240, 255, 0.4)', color2: 'rgba(168, 85, 247, 0)' },
    { baseY: 175, amp: 45, freq: 0.004, speed: 0.0006, color1: 'rgba(168, 85, 247, 0.35)', color2: 'rgba(56, 217, 169, 0)' },
  ];

  ribbons.forEach((ribbon) => {
    ctx.beginPath();
    ctx.moveTo(0, -curOffsetY);
    for (let x = 0; x <= vWidth + 20; x += 25) {
      const waveY =
        ribbon.baseY +
        Math.sin(x * ribbon.freq + timestamp * ribbon.speed) * ribbon.amp +
        Math.cos(x * 0.012 - timestamp * 0.001) * 20;
      ctx.lineTo(x, waveY);
    }
    ctx.lineTo(vWidth + 20, -curOffsetY);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, -curOffsetY, 0, ribbon.baseY + ribbon.amp + 40);
    grad.addColorStop(0, ribbon.color2);
    grad.addColorStop(0.6, ribbon.color1);
    grad.addColorStop(1, 'rgba(10, 58, 64, 0)');
    ctx.fillStyle = grad;
    ctx.fill();
  });
  ctx.restore();

  // Glacial Ice Spires & Frosted Mountains
  const glacierOffset = (bgOffset * 0.3) % 350;
  ctx.save();
  ctx.fillStyle = '#061D24';
  ctx.strokeStyle = '#38D9A9';
  ctx.shadowColor = '#38D9A9';
  ctx.shadowBlur = 8;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-30, playableHeight);
  for (let x = -30; x <= vWidth + 30; x += 55) {
    const gIdx = Math.floor((x + glacierOffset) / 55);
    const iceH = 65 + Math.sin(gIdx * 4.2) * 45 + Math.cos(gIdx * 1.7) * 25;
    ctx.lineTo(x, playableHeight - iceH);
  }
  ctx.lineTo(vWidth + 30, playableHeight);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Drifting Snow & Cryo Embers
  ctx.save();
  ctx.fillStyle = '#E0F2FE';
  for (let s = 0; s < 25; s++) {
    const sx = (s * 87 - timestamp * 0.02) % vWidth;
    const sy = (s * 41 + Math.sin(timestamp * 0.002 + s) * 15 - curOffsetY * 0.3) % (playableHeight - 40);
    const alpha = 0.25 + (Math.sin(timestamp * 0.003 + s) + 1) * 0.3;
    ctx.globalAlpha = Math.max(0.1, alpha);
    ctx.beginPath();
    ctx.arc((sx + vWidth) % vWidth, (sy + playableHeight) % playableHeight, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 7. APEX CITADEL
 * Soaring golden utopian spires, rotating quantum celestial halo rings, vertical ascension energy beams,
 * floating sky islands, and amber cloudbanks.
 */
function drawCitadel(
  ctx: CanvasRenderingContext2D,
  vWidth: number,
  playableHeight: number,
  curOffsetY: number,
  timestamp: number,
  bgOffset: number,
  curTheme: SectorColorStage
) {
  drawStarfield(ctx, vWidth, playableHeight, curOffsetY, timestamp, 35, '#FDE68A');

  // Vertical Ascension Energy Beams in Background
  ctx.save();
  const beamX1 = ((vWidth * 0.3 - bgOffset * 0.1) % vWidth + vWidth) % vWidth;
  const beamX2 = ((vWidth * 0.72 - bgOffset * 0.1) % vWidth + vWidth) % vWidth;

  [beamX1, beamX2].forEach((bx) => {
    const beamGrad = ctx.createLinearGradient(bx, playableHeight, bx, -curOffsetY);
    beamGrad.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
    beamGrad.addColorStop(0.7, 'rgba(251, 191, 36, 0.15)');
    beamGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(bx - 12, -curOffsetY, 24, playableHeight + curOffsetY);

    // Core laser line
    ctx.strokeStyle = '#FDE68A';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(bx, playableHeight);
    ctx.lineTo(bx, -curOffsetY);
    ctx.stroke();
    ctx.shadowBlur = 0;
  });
  ctx.restore();

  // Utopian Gilded Spires
  const spireOffset = (bgOffset * 0.35) % 380;
  ctx.save();
  let curX = -spireOffset;
  let sIdx = 0;
  while (curX < vWidth + 120) {
    const spireW = 42 + (sIdx % 3) * 14;
    const spireH = 130 + Math.sin(sIdx * 2.8) * 60 + (sIdx % 2) * 40;
    const spireTop = playableHeight - spireH;

    // Tower base
    ctx.fillStyle = '#1A1408';
    ctx.fillRect(curX, spireTop, spireW, spireH);

    // Golden Trim & Architectural Lines
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(curX, spireTop, spireW, spireH);

    // Stepped Apex Crown
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.moveTo(curX, spireTop);
    ctx.lineTo(curX + spireW / 2, spireTop - 25);
    ctx.lineTo(curX + spireW, spireTop);
    ctx.closePath();
    ctx.fill();

    // Rotating Quantum Celestial Halo Rings around primary towers
    if (sIdx % 2 === 0) {
      const haloY = spireTop + 45;
      ctx.save();
      ctx.strokeStyle = '#FDE68A';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(curX + spireW / 2, haloY, spireW * 1.35, 10, Math.sin(timestamp * 0.0015 + sIdx) * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    curX += spireW + 24;
    sIdx++;
  }
  ctx.restore();
}

/**
 * 8. ACID OVERDRIVE
 * Pulsing dynamic audio equalizer tower bars, concentric hypnotic neon diamond portals,
 * high-voltage laser strobes, and floating chromatic polyhedrons.
 */
function drawAcid(
  ctx: CanvasRenderingContext2D,
  vWidth: number,
  playableHeight: number,
  curOffsetY: number,
  timestamp: number,
  bgOffset: number,
  curTheme: SectorColorStage
) {
  // Hypnotic Concentric Neon Diamond Portals in the Sky
  ctx.save();
  const portalX = vWidth * 0.5;
  const portalY = playableHeight * 0.38;
  const ringCount = 5;

  for (let r = ringCount; r >= 1; r--) {
    const scale = ((timestamp * 0.0006 + r / ringCount) % 1) * 160;
    const alpha = Math.max(0, 1 - scale / 160) * 0.45;
    ctx.strokeStyle = r % 2 === 0 ? '#CCFF00' : '#FF007F';
    ctx.lineWidth = 2;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = r % 2 === 0 ? '#CCFF00' : '#FF007F';
    ctx.shadowBlur = 10;

    ctx.save();
    ctx.translate(portalX, portalY);
    ctx.rotate(timestamp * 0.001 * (r % 2 === 0 ? 1 : -1));
    ctx.beginPath();
    // Diamond path
    ctx.moveTo(0, -scale);
    ctx.lineTo(scale, 0);
    ctx.lineTo(0, scale);
    ctx.lineTo(-scale, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  ctx.shadowBlur = 0;
  ctx.restore();

  // High-Voltage Diagonal Laser Strobes
  const laserFlash = Math.sin(timestamp * 0.004) > 0.6;
  if (laserFlash) {
    ctx.save();
    ctx.strokeStyle = '#CCFF00';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#CCFF00';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(vWidth, playableHeight - 90);
    ctx.stroke();

    ctx.strokeStyle = '#FF007F';
    ctx.shadowColor = '#FF007F';
    ctx.beginPath();
    ctx.moveTo(vWidth, 30);
    ctx.lineTo(0, playableHeight - 110);
    ctx.stroke();
    ctx.restore();
  }

  // Dynamic Audio Graphic Equalizer Skyline
  const barWidth = 26;
  const gap = 12;
  const totalBarWidth = barWidth + gap;
  const barCount = Math.ceil(vWidth / totalBarWidth) + 1;

  ctx.save();
  for (let b = 0; b < barCount; b++) {
    const bx = b * totalBarWidth;
    // Equalizer height modulated by rhythm mathematics
    const freq1 = Math.sin(b * 0.45 + timestamp * 0.006);
    const freq2 = Math.cos(b * 0.85 - timestamp * 0.009);
    const normalized = (freq1 + freq2 + 2) / 4; // 0 to 1
    const totalHeight = 40 + normalized * 160;

    const blockHeight = 8;
    const blockGap = 4;
    const blocks = Math.floor(totalHeight / (blockHeight + blockGap));

    for (let k = 0; k < blocks; k++) {
      const blockY = playableHeight - (k + 1) * (blockHeight + blockGap);
      const ratio = k / 18;

      // Color gradation: lime green at base, cyan mid, hot pink top
      if (ratio < 0.45) {
        ctx.fillStyle = '#CCFF00';
      } else if (ratio < 0.75) {
        ctx.fillStyle = '#00F0FF';
      } else {
        ctx.fillStyle = '#FF007F';
      }

      ctx.fillRect(bx, blockY, barWidth, blockHeight);
    }

    // Floating Peak Indicator Bar
    const peakY = playableHeight - (blocks + 1) * (blockHeight + blockGap) - 6;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(bx, peakY, barWidth, 3);
  }
  ctx.restore();
}

/**
 * Master dispatcher that renders the appropriate background for each theme
 */
export function renderThemeBackground(
  ctx: CanvasRenderingContext2D,
  themeId: CyberThemeId,
  vWidth: number,
  playableHeight: number,
  curOffsetY: number,
  timestamp: number,
  bgOffset: number,
  curTheme: SectorColorStage
) {
  switch (themeId) {
    case 'synthwave':
      drawSynthwave(ctx, vWidth, playableHeight, curOffsetY, timestamp, bgOffset, curTheme);
      break;
    case 'matrix':
      drawMatrix(ctx, vWidth, playableHeight, curOffsetY, timestamp, bgOffset, curTheme);
      break;
    case 'void':
      drawVoid(ctx, vWidth, playableHeight, curOffsetY, timestamp, bgOffset, curTheme);
      break;
    case 'solar':
      drawSolar(ctx, vWidth, playableHeight, curOffsetY, timestamp, bgOffset, curTheme);
      break;
    case 'aurora':
      drawAurora(ctx, vWidth, playableHeight, curOffsetY, timestamp, bgOffset, curTheme);
      break;
    case 'citadel':
      drawCitadel(ctx, vWidth, playableHeight, curOffsetY, timestamp, bgOffset, curTheme);
      break;
    case 'acid':
      drawAcid(ctx, vWidth, playableHeight, curOffsetY, timestamp, bgOffset, curTheme);
      break;
    case 'cyberpunk':
    default:
      drawCyberpunk(ctx, vWidth, playableHeight, curOffsetY, timestamp, bgOffset, curTheme);
      break;
  }
}
