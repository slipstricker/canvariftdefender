

import { Enemy, Player, HatItem, StaffItem, Projectile, ProjectileEffectType, Platform, MouseState, ParticleType } from '../types';
import { SPRITE_PIXEL_SIZE, PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_ART_WIDTH, PLAYER_ART_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_PROJECTILE_COLOR, HEALING_DRONE_BLINK_SPEED, BOSS_LASER_COLOR, BOSS_LASER_GLOW_COLOR } from '../constants';
import { SUPER_ALIEN_PALETTE_REF, SPLITTER_PALETTE_REF, MINI_ALIEN_PALETTE_REF } from './spriteArt'; // Import palette refs
import { hexToRgba, isColorDark } from './utils';


export function drawPlayerCanvas(ctx: CanvasRenderingContext2D, player: Player, gameTime: number) {
  const pX = player.x;
  const pY = player.y;
  const pW = player.width;
  const pH = player.height;

  ctx.save();
  ctx.translate(pX, pY);

  const robeColorPrimary = '#6A5ACD'; 
  const robeColorAccent = '#8A7FFF';  
  const skinColor = '#B8CCE2';       
  const beardColor = '#E8FFFF';     
  const shoeColor = '#2A2F5A';      
  const eyeColor = '#00FFFF';       

  const bodyWidth = pW * 0.75;
  const bodyHeight = pH * 0.85;
  const bodyYOffset = pH - bodyHeight;
  
  const idleBob = player.animationState === 'idle' ? Math.sin(gameTime * 2.5) * pH * 0.018 : 0;
  let legOffset = 0;
  if (player.animationState === 'walking') {
    legOffset = Math.sin(gameTime * 12) * pW * 0.07;
  }

  const shoeWidth = pW * 0.28;
  const shoeHeight = pH * 0.12;
  ctx.fillStyle = shoeColor;
  ctx.fillRect(pW/2 - bodyWidth/2 + legOffset + shoeWidth*0.15, pH - shoeHeight + idleBob, shoeWidth, shoeHeight);
  ctx.fillRect(pW/2 + bodyWidth/2 - shoeWidth*1.15 - legOffset, pH - shoeHeight + idleBob, shoeWidth, shoeHeight);


  const gradient = ctx.createLinearGradient(pW/2, bodyYOffset + idleBob, pW/2, pH + idleBob);
  gradient.addColorStop(0, robeColorAccent);
  gradient.addColorStop(0.3, robeColorPrimary);
  gradient.addColorStop(1, '#3A3F78'); 
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(pW/2 - bodyWidth/2, bodyYOffset + bodyHeight * 0.15 + idleBob); 
  ctx.quadraticCurveTo(pW/2, bodyYOffset + idleBob * 0.5, pW/2 + bodyWidth/2, bodyYOffset + bodyHeight * 0.15 + idleBob); 
  ctx.lineTo(pW/2 + bodyWidth/2 * 0.85, pH - shoeHeight + idleBob); 
  ctx.quadraticCurveTo(pW/2, pH + idleBob * 0.7, pW/2 - bodyWidth/2 * 0.85, pH - shoeHeight + idleBob); 
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `rgba(190, 220, 255, ${0.3 + Math.sin(gameTime * 1.5) * 0.1})`; 
  const runeCount = 5;
  for (let i = 0; i < runeCount; i++) {
    const runeX = pW/2 + (Math.random() - 0.5) * bodyWidth * 0.7; 
    const runeY = bodyYOffset + bodyHeight * (0.3 + Math.random() * 0.6) + idleBob;
    const runeSize = pW * (0.02 + Math.random() * 0.02);
    ctx.beginPath();
    ctx.arc(runeX, runeY, runeSize, 0, Math.PI * 2);
    ctx.fill();
    if (i % 2 === 0) { 
        ctx.fillStyle = `rgba(230, 245, 255, ${0.4 + Math.sin(gameTime * 1.5 + i) * 0.15})`;
        ctx.beginPath();
        ctx.arc(runeX, runeY, runeSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(190, 220, 255, ${0.3 + Math.sin(gameTime * 1.5) * 0.1})`;
    }
  }


  const headRadius = pW * 0.2;
  const headX = pW / 2;
  const headY = bodyYOffset + headRadius * 1.1 + idleBob; 
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#A8BBC9'; 
  const noseRadius = headRadius * 0.2;
  ctx.beginPath();
  ctx.arc(headX, headY + headRadius * 0.15, noseRadius, 0, Math.PI * 2);
  ctx.fill();

  const eyeRadius = headRadius * 0.2;
  const eyeOffsetY = headY - headRadius * 0.15;
  const eyeSeparation = headRadius * 0.45;
  ctx.fillStyle = eyeColor;
  ctx.shadowColor = eyeColor;
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.arc(headX - eyeSeparation / 2, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(headX + eyeSeparation / 2, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  ctx.fillStyle = beardColor;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(headX - headRadius * 0.85, headY + headRadius * 0.2); 
  ctx.quadraticCurveTo(headX - headRadius * 1.1, headY + headRadius * 1.6, headX - headRadius * 0.3, headY + headRadius * 2.5); 
  ctx.quadraticCurveTo(headX, headY + headRadius * 3.0, headX + headRadius * 0.3, headY + headRadius * 2.5); 
  ctx.quadraticCurveTo(headX + headRadius * 1.1, headY + headRadius * 1.6, headX + headRadius * 0.85, headY + headRadius * 0.2); 
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  
  const handRadiusFactor = pW * 0.07;
  const handOffsetXPlayer = player.facingDirection === 'right' ? pW * 0.18 : -pW * 0.18; 
  const handOffsetYPlayer = bodyHeight * 0.38;
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(pW/2 + handOffsetXPlayer, bodyYOffset + handOffsetYPlayer + idleBob, handRadiusFactor, 0, Math.PI*2);
  ctx.fill();

  ctx.restore();
}

export function drawHatCanvas(ctx: CanvasRenderingContext2D, hat: HatItem, player: Player, gameTime: number) {
  if (!player) return;

  const pX = player.x;
  const pY = player.y;
  const pW = player.width;
  const pH = player.height;

  const playerBodyYOffset = pH - (pH * 0.85); 
  const headRadius = pW * 0.2;
  const playerHeadX = pX + pW / 2;
  const playerHeadY = pY + playerBodyYOffset + headRadius * 1.1; 
  const idleBob = player.animationState === 'idle' ? Math.sin(gameTime * 2.5) * pH * 0.018 : 0;
  
  const baseHatWidth = pW * 0.75; 
  const baseHatHeight = pH * 0.65;

  let hatDrawX = playerHeadX; 
  let hatDrawY = playerHeadY - headRadius * 0.75 + idleBob; 

  ctx.save();
  ctx.translate(hatDrawX, hatDrawY);

  const primarySpaceColor = '#3D4A70'; 
  const accentSpaceColor = '#94A5D0'; 
  const crystalColor = '#00E0E0';     
  const metallicSilver = '#C0C0C0';
  const metallicGold = '#FFD700';


  switch (hat.id) {
    case 'hat_wizard': 
      const wizHatHeight = baseHatHeight * 2.0; 
      const wizHatBaseWidth = baseHatWidth * 0.7;
      const wizHatBrimWidth = wizHatBaseWidth * 1.4; 
      const wizHatBrimHeight = wizHatHeight * 0.10;
      
      ctx.fillStyle = primarySpaceColor;
      ctx.beginPath();
      ctx.ellipse(0, wizHatBrimHeight * 0.4, wizHatBrimWidth / 2, wizHatBrimHeight / 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = metallicSilver;
      ctx.lineWidth = pH * 0.015;
      ctx.stroke();
      
      const coneGrad = ctx.createLinearGradient(0, -wizHatHeight + wizHatBrimHeight, 0, wizHatBrimHeight * 0.1);
      coneGrad.addColorStop(0, accentSpaceColor);
      coneGrad.addColorStop(1, primarySpaceColor);
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(0, -wizHatHeight + wizHatBrimHeight); 
      ctx.lineTo(-wizHatBaseWidth / 2.0, wizHatBrimHeight * 0.1); 
      ctx.lineTo(wizHatBaseWidth / 2.0, wizHatBrimHeight * 0.1); 
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = `rgba(220, 240, 255, 0.5)`;
      for (let i = 0; i < 5; i++) {
        const starX = (Math.random() - 0.5) * wizHatBaseWidth * 0.4;
        const starY = -wizHatHeight * (0.2 + Math.random() * 0.5) + wizHatBrimHeight;
        const starSize = wizHatBaseWidth * (0.03 + Math.random()*0.02);
        ctx.beginPath(); ctx.arc(starX, starY, starSize, 0, Math.PI*2); ctx.fill();
      }

      const crystalTipY = -wizHatHeight + wizHatBrimHeight - pH * 0.05;
      ctx.fillStyle = crystalColor;
      ctx.shadowColor = crystalColor; ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.moveTo(0, crystalTipY - pH * 0.06);
      ctx.lineTo(pH * 0.03, crystalTipY);
      ctx.lineTo(0, crystalTipY + pH * 0.06);
      ctx.lineTo(-pH * 0.03, crystalTipY);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      break;

    case 'hat_helmet': 
      const helmetW = baseHatWidth * 0.9;
      const helmetH = baseHatHeight * 0.8;
      const helmetBaseColor = '#4A5568'; 
      const helmetAccentColor = '#718096'; 
      const helmetGlowColor = '#4FD1C5'; 

      ctx.fillStyle = helmetBaseColor;
      ctx.beginPath();
      ctx.moveTo(-helmetW * 0.5, -helmetH * 0.3); 
      ctx.quadraticCurveTo(-helmetW * 0.6, 0, -helmetW * 0.45, helmetH * 0.4); 
      ctx.lineTo(helmetW * 0.4, helmetH * 0.45); 
      ctx.quadraticCurveTo(helmetW * 0.55, 0, helmetW * 0.45, -helmetH * 0.35); 
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = helmetAccentColor;
      ctx.beginPath();
      ctx.moveTo(-helmetW * 0.4, -helmetH * 0.25);
      ctx.lineTo(-helmetW * 0.2, -helmetH * 0.35);
      ctx.lineTo(-helmetW * 0.25, helmetH * 0.1);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = helmetGlowColor;
      ctx.shadowColor = helmetGlowColor; ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(helmetW * 0.1, -helmetH * 0.05, helmetW * 0.3, helmetH * 0.2, 0, 0, Math.PI * 2); 
      ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      
      ctx.strokeStyle = helmetGlowColor; ctx.lineWidth = pH * 0.015;
      ctx.beginPath();
      ctx.moveTo(-helmetW * 0.3, helmetH * 0.3);
      ctx.quadraticCurveTo(-helmetW * 0.1, helmetH * 0.1, 0, -helmetH * 0.1);
      ctx.quadraticCurveTo(helmetW * 0.2, -helmetH * 0.25, helmetW * 0.4, -helmetH * 0.1);
      ctx.stroke();

      ctx.fillStyle = helmetAccentColor;
      ctx.beginPath();
      ctx.moveTo(helmetW * 0.35, -helmetH * 0.3);
      ctx.lineTo(helmetW * 0.45, -helmetH * 0.5);
      ctx.lineTo(helmetW * 0.4, -helmetH * 0.55);
      ctx.closePath();
      ctx.fill();
      break;

    case 'hat_propeller_beanie': 
      const beanieR = baseHatWidth * 0.48;
      const beanieH = baseHatHeight * 0.7;
      const nebulaCols = ['#2B316C', '#4A00E0', '#8E44AD', '#C71585']; 
      const starCol = '#FFFFE0'; 

      for (let i = 0; i < 4; i++) {
        const swirlAngle = gameTime * 0.1 + i * Math.PI / 2; 
        const swirlRadiusX = beanieR * (0.6 + Math.sin(swirlAngle * 0.5 + i) * 0.2);
        const swirlRadiusY = beanieR * (0.4 + Math.cos(swirlAngle * 0.7 + i) * 0.15);
        ctx.fillStyle = hexToRgba(nebulaCols[i % nebulaCols.length], 0.3 + Math.random()*0.1); 
        ctx.beginPath();
        ctx.ellipse(
            Math.cos(swirlAngle + i) * beanieR * 0.1, 
            -beanieH * 0.35 + Math.sin(swirlAngle * 1.2 + i) * beanieR * 0.1,
            swirlRadiusX, swirlRadiusY,
            swirlAngle * 0.3, 
            0, Math.PI * 2
        );
        ctx.fill();
      }
      
      ctx.fillStyle = '#1A1D36'; 
      ctx.beginPath();
      ctx.arc(0, -beanieH * 0.25, beanieR, Math.PI, 0); 
      ctx.ellipse(0, -beanieH*0.25 + beanieR*0.75, beanieR, beanieR*0.25, 0, 0, Math.PI); 
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#2C3E50'; 
      ctx.beginPath();
      ctx.ellipse(0, -beanieH * 0.25 + beanieR * 0.75, beanieR, beanieR * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = starCol;
      for(let i=0; i<5; i++){
          const gemX = (Math.random() - 0.5) * beanieR * 1.5;
          const gemY = -beanieH * 0.4 + (Math.random() - 0.5) * beanieR * 0.8;
          const twinkleAlpha = 0.6 + Math.sin(gameTime * (2 + Math.random()*2) + i) * 0.4;
          ctx.fillStyle = hexToRgba(starCol, twinkleAlpha); 
          ctx.shadowBlur = Math.random() * 3 + 2;
          ctx.beginPath(); ctx.arc(gemX, gemY, pH * (0.015 + Math.random()*0.01), 0, Math.PI*2); ctx.fill();
      }
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      break;
      
    case 'hat_crown': 
      const crownBaseH = baseHatHeight * 0.3; 
      const crownBaseW = baseHatWidth * 0.85;
      const bandColor = '#2D3748'; 
      const focalCrystalColor = '#E0FFFF'; 
      hatDrawY += pH*0.1; 

      ctx.fillStyle = bandColor;
      ctx.beginPath();
      ctx.rect(-crownBaseW / 2, -crownBaseH * 0.3, crownBaseW, crownBaseH * 0.6);
      ctx.fill();
      
      const orbitRadius = crownBaseW * 0.6;
      const numOrbs = 2;
      const orbColors = ['#60A5FA', '#F87171', '#FBBF24']; 
      for(let i=0; i<numOrbs; i++) {
          const angle = gameTime * (0.5 + i*0.1) + i * Math.PI; 
          const orbX = Math.cos(angle) * orbitRadius;
          const orbY = -crownBaseH * 0.1 + Math.sin(angle * 0.5) * crownBaseH * 0.4; 
          const orbSize = pH * (0.02 + Math.random()*0.01);
          ctx.fillStyle = orbColors[i % orbColors.length];
          ctx.beginPath();
          ctx.arc(orbX, orbY, orbSize, 0, Math.PI*2);
          ctx.fill();
      }
      for(let i=0; i<3; i++) {
        const angle = gameTime * (0.8 + i*0.2) + i * Math.PI * 0.7;
        const fragX = Math.cos(angle) * orbitRadius * 0.8;
        const fragY = -crownBaseH * 0.1 + Math.sin(angle * 0.6) * crownBaseH * 0.5;
        const fragSize = pH * 0.015;
        ctx.fillStyle = metallicGold;
        ctx.beginPath(); 
        ctx.rect(fragX - fragSize/2, fragY - fragSize/2, fragSize, fragSize);
        ctx.fill();
      }

      const pulse = 0.7 + Math.sin(gameTime * 2) * 0.3;
      ctx.fillStyle = hexToRgba(focalCrystalColor, pulse);
      ctx.shadowColor = focalCrystalColor; ctx.shadowBlur = 10 * pulse;
      const crystalH = crownBaseH * 1.5;
      const crystalW = crownBaseW * 0.15;
      ctx.beginPath();
      ctx.moveTo(0, -crystalH); 
      ctx.lineTo(-crystalW, -crownBaseH * 0.2);
      ctx.lineTo(crystalW, -crownBaseH * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      break;
      
    case 'hat_basic_cap': 
        const hoodH = baseHatHeight * 1.1; 
        const hoodW = baseHatWidth * 0.9;
        const hoodColor = '#3C366B'; 
        const hoodGlowColor = '#93C5FD'; 
        hatDrawY += pH * 0.05; 

        ctx.fillStyle = hoodColor;
        ctx.beginPath();
        ctx.moveTo(-hoodW * 0.5, -hoodH * 0.8); 
        ctx.quadraticCurveTo(0, -hoodH * 0.95, hoodW * 0.5, -hoodH * 0.8); 
        ctx.lineTo(hoodW * 0.4, hoodH * 0.1); 
        ctx.quadraticCurveTo(0, hoodH * 0.25, -hoodW * 0.4, hoodH * 0.1); 
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-hoodW * 0.35, hoodH * 0.05);
        ctx.quadraticCurveTo(-hoodW * 0.45, hoodH * 0.3, -hoodW*0.25, hoodH * 0.2);
        ctx.quadraticCurveTo(0, hoodH*0.4, hoodW*0.25, hoodH * 0.2);
        ctx.quadraticCurveTo(hoodW * 0.45, hoodH * 0.3, hoodW * 0.35, hoodH * 0.05);
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.strokeStyle = hoodGlowColor;
        ctx.lineWidth = pH * 0.015;
        ctx.shadowColor = hoodGlowColor; ctx.shadowBlur = 5;
        
        ctx.beginPath();
        ctx.moveTo(hoodW * 0.4, hoodH * 0.1); 
        ctx.quadraticCurveTo(0, hoodH * 0.25, -hoodW * 0.4, hoodH * 0.1);
        ctx.stroke();

        const starSizeHood = pH * 0.01;
        ctx.fillStyle = hoodGlowColor;
        const constX = -hoodW * 0.2; 
        const constYBase = -hoodH * 0.3;
        ctx.beginPath(); ctx.arc(constX, constYBase, starSizeHood, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(constX + hoodW*0.08, constYBase - hoodH*0.05, starSizeHood, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(constX + hoodW*0.16, constYBase - hoodH*0.1, starSizeHood, 0, Math.PI*2); ctx.fill();

        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      break;

    default: 
      const capH_default = baseHatHeight * 0.65;
      const capW_default = baseHatWidth * 0.75;
      ctx.fillStyle = primarySpaceColor;
      ctx.beginPath();
      ctx.roundRect(-capW_default/2, -capH_default, capW_default, capH_default*0.8, capW_default*0.1);
      ctx.fill();
      ctx.fillStyle = accentSpaceColor;
      ctx.beginPath();
      ctx.ellipse(0, -capH_default*0.2, capW_default*0.55, capH_default*0.25, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = metallicSilver;
      ctx.beginPath();
      ctx.arc(0, -capH_default * 0.65, capW_default * 0.12, 0, Math.PI*2);
      ctx.fill();
      break;
  }
  ctx.restore();
}

export function drawStaffCanvas(
    ctx: CanvasRenderingContext2D, 
    staff: StaffItem, 
    player: Player, 
    gameTime: number,
    mouse: MouseState | null,
    canvasRect: { x: number, y: number, width: number, height: number } | null,
    internalCanvasWidth: number,
    internalCanvasHeight: number
) {
  if (!player) return;

  const pX = player.x;
  const pY = player.y;
  const pW = player.width;
  const pH = player.height;

  const playerBodyYOffset = pH - (pH * 0.85);
  const bodyHeight = pH * 0.85;
  const handRadiusFactor = pW * 0.07;
  const handOffsetXPlayer = player.facingDirection === 'right' ? pW * 0.18 : -pW * 0.18; 
  const handOffsetYPlayer = bodyHeight * 0.38;
  const idleBob = player.animationState === 'idle' ? Math.sin(gameTime * 2.5) * pH * 0.018 : 0;
  
  const handGlobalX = pX + pW/2 + handOffsetXPlayer;
  const handGlobalY = pY + playerBodyYOffset + handOffsetYPlayer + idleBob;
  
  let staffAngle = 0;
  if (mouse && canvasRect) {
    const internalMouseX = (mouse.x - canvasRect.x) * (internalCanvasWidth / canvasRect.width);
    const internalMouseY = (mouse.y - canvasRect.y) * (internalCanvasHeight / canvasRect.height);
    staffAngle = Math.atan2(internalMouseY - handGlobalY, internalMouseX - handGlobalX);
  } else {
    staffAngle = player.facingDirection === 'right' ? -Math.PI / 5 : Math.PI + Math.PI / 5;
  }
  
  const staffLength = pH * 0.95; 
  const staffWidth = pW * 0.07; 

  ctx.save();
  ctx.translate(handGlobalX, handGlobalY); 
  ctx.rotate(staffAngle); 

  let shaftColor = '#4A4A4A'; 
  let tipPrimaryColor = staff.projectileColor || '#00FFFF'; 
  let tipAccentColor = staff.projectileGlowColor || '#FFFFFF'; 
  let tipShape: 'orb' | 'crystal_cluster' | 'plasma_core' | 'nebula_swirl' | 'comet_head' | 'black_hole' = 'orb';

  switch (staff.id) {
    case 'staff_wizard': shaftColor = '#301934'; tipShape = 'orb'; break; 
    case 'staff_emerald': shaftColor = '#27AE60'; tipShape = 'crystal_cluster'; break; 
    case 'staff_boom': case 'staff_fire_visual': shaftColor = '#E67E22'; tipShape = 'plasma_core'; break; 
    case 'staff_thunder': shaftColor = '#7F8C8D'; tipShape = 'orb'; break; 
    case 'staff_frozen_tip': case 'staff_ice_visual': shaftColor = '#5DADE2'; tipShape = 'comet_head'; break; 
    case 'staff_rainbow': shaftColor = '#ABB2B9'; tipShape = 'nebula_swirl'; break;
    case 'staff_shadow_visual': shaftColor = '#17202A'; tipShape = 'black_hole'; break;
  }

  ctx.fillStyle = shaftColor;
  ctx.beginPath();
  ctx.roundRect(handRadiusFactor*0.4, -staffWidth / 2, staffLength, staffWidth, staffWidth/3); 
  ctx.fill();
  
  ctx.fillStyle = `rgba(0, 255, 255, ${0.4 + Math.sin( (staff.id.charCodeAt(0) || 0) * 0.1 + gameTime*0) *0.1})`; 
  for(let i=0; i<3; i++){
    const runeX = staffLength * (0.2 + i*0.25);
    const runeY = 0;
    const runeSize = staffWidth * 0.4;
    ctx.beginPath();
    ctx.arc(runeX, runeY, runeSize, 0, Math.PI * 2);
    ctx.fill();
  }

  const tipX = staffLength + handRadiusFactor*0.4; 
  const tipY = 0;
  const baseTipRadius = staffWidth * 3;

  const staticShadowBlur = 5 + ( (staff.id.charCodeAt(1) || 0) % 5);
  ctx.shadowColor = tipAccentColor;
  ctx.shadowBlur = staticShadowBlur; 

  if (tipShape === 'orb') {
    if (staff.id === 'staff_thunder') { 
        ctx.fillStyle = tipPrimaryColor; const starPoints = 5; const outerRadius = baseTipRadius * 1.2; const innerRadius = baseTipRadius * 0.6;
        ctx.beginPath(); for (let i = 0; i < starPoints * 2; i++) { const radius = (i % 2 === 0) ? outerRadius : innerRadius; const angle = Math.PI / starPoints * i - Math.PI / 2; ctx.lineTo(tipX + radius * Math.cos(angle), tipY + radius * Math.sin(angle)); } ctx.closePath(); ctx.fill();
    } else { 
        const grad = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, baseTipRadius); grad.addColorStop(0, hexToRgba(tipAccentColor, 1)); grad.addColorStop(0.7, hexToRgba(tipPrimaryColor, 0.9)); grad.addColorStop(1, hexToRgba(tipPrimaryColor, 0.5)); ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(tipX, tipY, baseTipRadius, 0, Math.PI * 2); ctx.fill();
    }
  } else if (tipShape === 'crystal_cluster') {
    for(let i=0; i<4; i++){
        ctx.fillStyle = hexToRgba(tipPrimaryColor, 0.7 + ((i*17)%20)/100.0 *0.2); 
        const angle = ((i*67)%(Math.PI*200))/100.0; 
        const cX = tipX + Math.cos(angle) * baseTipRadius * 0.3; const cY = tipY + Math.sin(angle) * baseTipRadius * 0.3; const cSize = baseTipRadius * (0.4 + ((i*31)%30)/100.0*0.3); 
        ctx.beginPath(); ctx.moveTo(cX, cY - cSize); ctx.lineTo(cX + cSize*0.6, cY + cSize*0.3); ctx.lineTo(cX - cSize*0.6, cY + cSize*0.3); ctx.closePath(); ctx.fill();
    }
  } else if (tipShape === 'plasma_core') {
    ctx.fillStyle = tipAccentColor; ctx.beginPath(); ctx.arc(tipX, tipY, baseTipRadius * 0.7, 0, Math.PI * 2); ctx.fill();
    const plasmaGrad = ctx.createRadialGradient(tipX, tipY, baseTipRadius*0.5, tipX, tipY, baseTipRadius*1.2); plasmaGrad.addColorStop(0, hexToRgba(tipPrimaryColor, 0.8)); plasmaGrad.addColorStop(1, hexToRgba(tipPrimaryColor, 0)); ctx.fillStyle = plasmaGrad; ctx.beginPath(); ctx.arc(tipX, tipY, baseTipRadius*1.2, 0, Math.PI * 2); ctx.fill();
  } else if (tipShape === 'nebula_swirl') {
    const nebulaColorsStaff = ['#E74C3C', '#8E44AD', '#3498DB', '#1ABC9C', '#F1C40F'];
    for(let i=0; i<3; i++){
        ctx.fillStyle = hexToRgba(nebulaColorsStaff[i % nebulaColorsStaff.length], 0.3 + ((i*29)%20)/100.0 *0.2); 
        const angle = ( ((staff.id.charCodeAt(2)||0)*i*11) % (Math.PI*200) ) /100.0; 
        const radius = baseTipRadius * (0.5 + i*0.2);
        ctx.beginPath(); ctx.arc(tipX + Math.cos(angle)*radius*0.2, tipY + Math.sin(angle)*radius*0.2, radius, 0, Math.PI*2); ctx.fill();
    }
  } else if (tipShape === 'comet_head') {
    ctx.fillStyle = tipPrimaryColor; ctx.beginPath(); ctx.arc(tipX, tipY, baseTipRadius, 0, Math.PI * 2); ctx.fill();
    const tailGrad = ctx.createLinearGradient(tipX, tipY, tipX - baseTipRadius*3, tipY); tailGrad.addColorStop(0, hexToRgba(tipAccentColor, 0.7)); tailGrad.addColorStop(1, hexToRgba(tipAccentColor, 0)); ctx.fillStyle = tailGrad;
    ctx.beginPath(); ctx.moveTo(tipX, tipY - baseTipRadius*0.8); ctx.lineTo(tipX - baseTipRadius*3, tipY); ctx.lineTo(tipX, tipY + baseTipRadius*0.8); ctx.closePath(); ctx.fill();
  } else if (tipShape === 'black_hole') {
    ctx.fillStyle = tipPrimaryColor; ctx.beginPath(); ctx.arc(tipX, tipY, baseTipRadius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = tipAccentColor; ctx.lineWidth = baseTipRadius * 0.3; ctx.beginPath(); ctx.arc(tipX, tipY, baseTipRadius*1.2, 0, Math.PI*2); ctx.stroke();
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.restore();
}

export function drawProjectileCanvas(ctx: CanvasRenderingContext2D, projectile: Projectile, gameTime: number) {
  ctx.save();
  
  if (projectile.appliedEffectType === 'boss_laser') {
    const originX = projectile.x;
    const originY = projectile.y;
    const thickness = projectile.width;
    const currentVisualLength = projectile.currentLength || 0;
    const laserAngle = projectile.angle || 0;

    ctx.translate(originX, originY);
    ctx.rotate(laserAngle);

    // Main Beam
    ctx.shadowColor = BOSS_LASER_GLOW_COLOR;
    ctx.shadowBlur = thickness * 1.5;
    ctx.fillStyle = hexToRgba(BOSS_LASER_GLOW_COLOR, 0.4);
    ctx.fillRect(0, -thickness * 0.75 / 2, currentVisualLength, thickness * 0.75);
    ctx.fillStyle = BOSS_LASER_COLOR;
    ctx.fillRect(0, -thickness / 2, currentVisualLength, thickness);
    ctx.fillStyle = hexToRgba('#FFFFFF', 0.8);
    ctx.fillRect(0, -thickness * 0.15 / 2, currentVisualLength, thickness * 0.15);
    ctx.shadowColor = 'transparent'; 
    ctx.shadowBlur = 0;

    // Advancing Tip Effect (only if laser is extending)
    if (currentVisualLength > 0 && (projectile.maxLength === undefined || currentVisualLength < projectile.maxLength)) {
        const tipPositionX = currentVisualLength;
        const tipRadius = thickness * 0.6; // Tip slightly wider than core beam
        const tipGlowRadius = tipRadius * 1.5;

        // Pulsing Glow at the tip
        const pulseFactor = 0.8 + Math.sin(gameTime * 30) * 0.2;
        ctx.fillStyle = hexToRgba(BOSS_LASER_GLOW_COLOR, 0.7 * pulseFactor);
        ctx.beginPath();
        ctx.arc(tipPositionX, 0, tipGlowRadius * pulseFactor, 0, Math.PI * 2);
        ctx.fill();

        // Bright Core at the tip
        ctx.fillStyle = hexToRgba('#FFFFFF', 0.95 * pulseFactor);
        ctx.beginPath();
        ctx.arc(tipPositionX, 0, tipRadius * pulseFactor * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Small flickering sparks/crackles
        const numSparks = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numSparks; i++) {
            if (Math.random() < 0.7) { // Chance to draw each spark per frame
                const sparkAngleOffset = (Math.random() - 0.5) * Math.PI * 0.4; // Spread sparks slightly
                const sparkLength = thickness * (0.2 + Math.random() * 0.5);
                const sparkThickness = thickness * (0.05 + Math.random() * 0.1);
                const sparkOpacity = 0.5 + Math.random() * 0.4;

                ctx.strokeStyle = hexToRgba('#FFFFFF', sparkOpacity * pulseFactor);
                ctx.lineWidth = sparkThickness;
                ctx.beginPath();
                ctx.moveTo(tipPositionX, 0); // Start from tip center
                ctx.lineTo(
                    tipPositionX + Math.cos(sparkAngleOffset) * sparkLength,
                    Math.sin(sparkAngleOffset) * sparkLength
                );
                ctx.stroke();
            }
        }
    }
  } else {
    // Existing logic for other projectiles
    const centerX = projectile.x + projectile.width / 2;
    const centerY = projectile.y + projectile.height / 2;
    let baseRadiusCalculation = Math.min(projectile.width, projectile.height) / 2 * 1.1; 

    ctx.translate(centerX, centerY);
    const angle = Math.atan2(projectile.vy || 0, projectile.vx || 0);
    ctx.rotate(angle);

    const coreColor = projectile.color;
    const isDarkCore = isColorDark(coreColor);
    const glowColor = projectile.glowEffectColor || (isDarkCore ? '#00FFFF' : coreColor); 
    
    if (projectile.owner === 'player' && (projectile.appliedEffectType === 'standard' || projectile.appliedEffectType === 'thunder_staff')) {
      baseRadiusCalculation *= 0.7;
    }
    const radius = baseRadiusCalculation;
    const coreGlowColorForWhiteCore = '#FFFFFF'; 

    if (isDarkCore) {
        ctx.shadowColor = hexToRgba(glowColor, 0.8);
        ctx.shadowBlur = radius * 1.5; 
    } else {
        ctx.shadowColor = hexToRgba(coreColor, 0.7); 
        ctx.shadowBlur = radius * 0.8;
    }

    ctx.fillStyle = coreColor;

    switch(projectile.appliedEffectType) {
      case 'star_shard': 
        ctx.fillStyle = coreColor; 
        ctx.beginPath();
        for (let i = 0; i < 5 * 2; i++) { const r = (i % 2 === 0) ? radius : radius * 0.5; const a = Math.PI / 5 * i - Math.PI / 2; ctx.lineTo(r * Math.cos(a), r * Math.sin(a)); }
        ctx.closePath(); ctx.fill(); break;
      case 'plasma_ball': 
        const plasmaGrad = ctx.createRadialGradient(0,0,0, 0,0,radius); 
        plasmaGrad.addColorStop(0, hexToRgba(isDarkCore ? glowColor : coreGlowColorForWhiteCore, 0.9)); 
        plasmaGrad.addColorStop(0.5, hexToRgba(coreColor, 0.8)); 
        plasmaGrad.addColorStop(1, hexToRgba(glowColor, 0.4));
        ctx.fillStyle = plasmaGrad; ctx.beginPath(); ctx.arc(0,0,radius,0,Math.PI*2); ctx.fill(); break;
      case 'comet_fragment':
        ctx.fillStyle = coreColor; ctx.beginPath(); ctx.ellipse(0,0, radius, radius*0.6, 0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = hexToRgba(glowColor, 0.5); ctx.beginPath(); ctx.moveTo(-radius*0.8,0); ctx.lineTo(-radius*1.5, -radius*0.3); ctx.lineTo(-radius*1.5, radius*0.3); ctx.closePath(); ctx.fill(); break;
      case 'shadow_bolt': 
      case 'trident': 
      case 'frozen_tip': 
      case 'boomstaff': 
      case 'emerald_homing': 
      case 'thunder_staff': 
      default: 
        const coreGrad = ctx.createRadialGradient(0,0,0, 0,0,radius); 
        coreGrad.addColorStop(0, hexToRgba(isDarkCore ? glowColor : coreGlowColorForWhiteCore, 0.9)); 
        coreGrad.addColorStop(0.6, hexToRgba(coreColor, 0.8)); 
        coreGrad.addColorStop(1, hexToRgba(glowColor, isDarkCore ? 0.6 : 0.4)); 
        ctx.fillStyle = coreGrad; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill(); break;
    }
  }
  
  ctx.restore(); 

  if (projectile.owner === 'player' && projectile.trailPoints && projectile.trailPoints.length > 0) {
    const trailBaseColor = projectile.glowEffectColor || projectile.color; 
    projectile.trailPoints.forEach(tp => {
        const alpha = (tp.life / tp.initialLife) * 0.5; 
        const trailRadius = tp.size * (tp.life / tp.initialLife);
        ctx.fillStyle = hexToRgba(trailBaseColor, alpha);
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, trailRadius, 0, Math.PI * 2); 
        ctx.fill();
    });
  }
}

export function drawGroundPlatformCanvas(ctx: CanvasRenderingContext2D, platform: Platform, gameTime: number) {
  const { x, y, width, height } = platform;
  ctx.save();
  ctx.globalAlpha = platform.currentAlpha;

  const baseGroundColor = '#404452'; 
  const midGroundColor = '#4A4E5A';  
  const highlightGroundColor = '#606470';

  ctx.fillStyle = baseGroundColor;
  ctx.beginPath();
  ctx.moveTo(x, y + height); 

  const segments = 20; 
  const undulationAmount = height * 0.1; 

  ctx.lineTo(x, y + undulationAmount + Math.sin(x * 0.1 + (platform.id.charCodeAt(0) || 0) * 0.1) * undulationAmount * 0.3);

  for (let i = 0; i <= segments; i++) {
    const segX = x + (width / segments) * i;
    const baseY = y + undulationAmount;
    const undulation = Math.sin(segX * 0.02 + i * 0.5 + (platform.id.charCodeAt(1) || 0) * 0.05) * undulationAmount * 0.5 + Math.sin(i*0.9) * undulationAmount * 0.2;
    if (i === 0) {
      ctx.lineTo(segX, baseY + undulation);
    } else {
      ctx.quadraticCurveTo(
        segX - (width / segments / 2),
        baseY + Math.sin((segX - (width / segments / 2)) * 0.02 + (i-0.5) * 0.5 + (platform.id.charCodeAt(2) || 0) * 0.05) * undulationAmount * 0.5 + Math.sin((i-0.5)*0.9) * undulationAmount * 0.2,
        segX,
        baseY + undulation
      );
    }
  }
  ctx.lineTo(x + width, y + height); 
  ctx.closePath();
  ctx.fill();
  
  const groundGrad = ctx.createLinearGradient(x,y, x, y+height);
  groundGrad.addColorStop(0, midGroundColor);
  groundGrad.addColorStop(0.7, baseGroundColor);
  ctx.fillStyle = groundGrad;
  ctx.fill();

  const numCraters = Math.floor(width / 180); 
  for (let i = 0; i < numCraters; i++) {
    const craterSeed = (platform.id.charCodeAt(3) || 1) * (i + 1);
    const craterX = x + ((craterSeed * 37) % 70 + 15) / 100 * width; 
    const craterRadius = 15 + ((craterSeed * 53) % 250) / 10;
    const platformTopYAtCrater = y + undulationAmount + Math.sin(craterX * 0.02 + (platform.id.charCodeAt(1) || 0) * 0.05) * undulationAmount * 0.5;
    const craterY = platformTopYAtCrater + craterRadius * 0.3 + ((craterSeed * 61) % 100) / 100 * height * 0.1;

    ctx.fillStyle = '#30333A'; 
    ctx.beginPath();
    ctx.ellipse(craterX, craterY + craterRadius * 0.15, craterRadius, craterRadius * 0.65, ((craterSeed * 19)%20-10)/100, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = highlightGroundColor; 
    ctx.beginPath();
    ctx.ellipse(craterX, craterY - craterRadius * 0.1, craterRadius * 0.85, craterRadius * 0.55, ((craterSeed * 23)%20-10)/100, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.shadowColor = '#00FFFF';
  for (let i = 0; i < 7; i++) {
    const crystalSeed = (platform.id.charCodeAt(4) || 1) * (i + 1);
    const crystalX = x + ((crystalSeed * 29) % 70 + 10) / 100 * width; 
    const platformTopYAtCrystal = y + undulationAmount + Math.sin(crystalX * 0.02 + (platform.id.charCodeAt(1) || 0) * 0.05) * undulationAmount * 0.5;
    const crystalY = platformTopYAtCrystal + height * (0.2 + ((crystalSeed * 41)%50)/100.0 );
    const crystalSize = 4 + ((crystalSeed * 13)%70)/10.0;
    
    ctx.fillStyle = `rgba(0, 200, 200, ${0.4 + ((crystalSeed*7)%20)/100.0*0.2})`; 
    ctx.shadowBlur = 4 + ((crystalSeed*3)%40)/10.0; 
    ctx.beginPath();
    ctx.moveTo(crystalX, crystalY - crystalSize);
    ctx.lineTo(crystalX + crystalSize*0.6, crystalY);
    ctx.lineTo(crystalX, crystalY + crystalSize);
    ctx.lineTo(crystalX - crystalSize*0.6, crystalY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  ctx.restore();
}

export function drawDynamicPlatformCanvas(ctx: CanvasRenderingContext2D, platform: Platform, gameTime: number) {
  const { x, y, width, height } = platform;
  ctx.save();
  ctx.globalAlpha = platform.currentAlpha;

  const baseColor = '#505869'; 
  const crackColor = '#3E424B'; 
  const crystalColor = '#8A2BE2'; 
  const crystalGlow = '#DA70D6'; 

  ctx.fillStyle = baseColor;
  ctx.beginPath();

  const points = [];
  const numSegments = 6 + Math.floor((platform.id.charCodeAt(0) || 0) % 5); 
  const baseRadiusX = width / 2;
  const baseRadiusY = height / 2;
  const centerX = x + baseRadiusX;
  const centerY = y + baseRadiusY;

  for (let i = 0; i < numSegments; i++) {
    const angle = (i / numSegments) * Math.PI * 2;
    const charCodeSeed = platform.id.charCodeAt(i % platform.id.length) || (70 + i);
    const radiusXDeform = baseRadiusX * (0.75 + ((charCodeSeed * 13) % 50) / 100); 
    const radiusYDeform = baseRadiusY * (0.75 + ((charCodeSeed * 17) % 50) / 100);
    points.push({
      x: centerX + Math.cos(angle) * radiusXDeform,
      y: centerY + Math.sin(angle) * radiusYDeform,
    });
  }
  
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < numSegments; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % numSegments];
    const charCodeSeed1 = platform.id.charCodeAt((i * 2) % platform.id.length) || (70 + i * 2);
    const charCodeSeed2 = platform.id.charCodeAt((i * 2 + 1) % platform.id.length) || (70 + i * 2 + 1);

    const cp1x = p1.x + (p2.x - p1.x) * 0.3 + (((charCodeSeed1 * 23) % 40) - 20) * 0.3; 
    const cp1y = p1.y + (p2.y - p1.y) * 0.7 + (((charCodeSeed1 * 29) % 40) - 20) * 0.3;
    const cp2x = p1.x + (p2.x - p1.x) * 0.7 - (((charCodeSeed2 * 31) % 40) - 20) * 0.3;
    const cp2y = p1.y + (p2.y - p1.y) * 0.3 - (((charCodeSeed2 * 37) % 40) - 20) * 0.3;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
  ctx.closePath();
  ctx.fill();


  ctx.strokeStyle = crackColor; 
  ctx.lineWidth = 1.5 + ((platform.id.charCodeAt(0) || 0 * 3) % 10) / 10.0; 
  for (let i=0; i < 2 + ((platform.id.charCodeAt(1) || 0) % 2); i++) { 
      ctx.beginPath();
      const crackSeed = (platform.id.charCodeAt(i + 2) || 70) * (i + 1);
      const startX = x + width * (0.1 + ((crackSeed * 11) % 800) / 1000.0);
      const startY = y + height * (0.1 + ((crackSeed * 13) % 800) / 1000.0);
      ctx.moveTo(startX, startY);
      for(let j=0; j<2; j++){ 
        const endX = startX + (((crackSeed*(j+1)*17)%100)-50)/100.0 * width * (0.2 + Math.random()*0.15);
        const endY = startY + (((crackSeed*(j+1)*19)%100)-50)/100.0 * height * (0.2 + Math.random()*0.15);
        ctx.quadraticCurveTo(
            startX + (endX - startX) * (0.3 + Math.random()*0.4), 
            startY + (endY - startY) * (0.3 + Math.random()*0.4),
            endX, endY
        );
      }
      ctx.stroke();
  }

  const numCrystals = 1 + ((platform.id.charCodeAt(0) || 0) % 3); 
  ctx.shadowColor = crystalGlow;
  for (let i = 0; i < numCrystals; i++) {
    const crystalSeed = (platform.id.charCodeAt(i + 4) || 70) * (i + 1);
    ctx.fillStyle = `rgba(186, 85, 211, ${0.5 + ((crystalSeed * 7)%25)/100.0})`; 
    ctx.shadowBlur = 3 + ((crystalSeed * 5)%30)/10.0; 
    const crystalSize = 4 + ((crystalSeed * 3)%50)/10.0;
    const cX = x + crystalSize + ((crystalSeed * 23) % (width - crystalSize*20))/10.0;
    const cY = y + crystalSize + ((crystalSeed * 29) % (height - crystalSize*20))/10.0;
    ctx.beginPath();
    for(let k=0; k<5; k++){ 
        const angle = (k/5) * Math.PI*2;
        const radius = crystalSize * (k%2 === 0 ? 1 : 0.6);
        ctx.lineTo(cX + Math.cos(angle)*radius, cY + Math.sin(angle)*radius);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  
  ctx.fillStyle = hexToRgba('#FFFFFF', 0.04); 
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width - 3, y + 3); ctx.lineTo(x + 3, y + 3);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = hexToRgba('#000000', 0.08); 
  ctx.beginPath();
  ctx.moveTo(x, y + height); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width - 3, y + height - 3); ctx.lineTo(x + 3, y + height - 3);
  ctx.closePath(); ctx.fill();

  ctx.restore();
}

export function drawCyclopsAlienCanvas(ctx: CanvasRenderingContext2D, enemy: Enemy, effectiveEnemyColor: string) {
    const bodyColor = '#483D8B'; const eyeColor = '#FFD700'; const pupilColor = '#000000'; const antennaColor = '#8A2BE2';
    const w = enemy.width; const h = enemy.height;
    const pulseFactor = 0.15 + Math.sin( (enemy.id.charCodeAt(0) || 0) *0.1 + Date.now()*0.000) * 0.1; 
    ctx.fillStyle = hexToRgba(antennaColor, 0.2 + pulseFactor * 0.5);
    ctx.beginPath(); ctx.ellipse(0, h * 0.1, w * 0.45, h * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hexToRgba(effectiveEnemyColor !== enemy.color ? effectiveEnemyColor : bodyColor, 1);
    ctx.beginPath(); ctx.ellipse(0, h * 0.1, w * 0.35, h * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    const eyeRadius = w * 0.2; ctx.fillStyle = eyeColor; ctx.beginPath(); ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pupilColor; ctx.beginPath(); ctx.arc(0, 0, eyeRadius * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = antennaColor; ctx.lineWidth = w * 0.05; ctx.beginPath(); ctx.moveTo(0, -h * 0.25); ctx.lineTo(0, -h * 0.45); ctx.stroke();
    ctx.fillStyle = antennaColor; ctx.beginPath(); ctx.arc(0, -h * 0.45 - w*0.04, w * 0.08, 0, Math.PI * 2); ctx.shadowColor = antennaColor; ctx.shadowBlur = 3; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
}

export function drawGreenClassicAlienCanvas(ctx: CanvasRenderingContext2D, enemy: Enemy, effectiveEnemyColor: string) {
    const headColor = '#2E8B57'; const eyeColor = '#1C1C1C'; const w = enemy.width; const h = enemy.height;
    const pulseFactor = 0.15 + Math.sin( (enemy.id.charCodeAt(1) || 0) *0.1 + Date.now()*0.000) * 0.1; 
    ctx.fillStyle = hexToRgba('#7FFF00', 0.15 + pulseFactor * 0.5);
    ctx.beginPath(); ctx.ellipse(0, 0, w * 0.45, h * 0.5, 0, 0, Math.PI * 2);  ctx.fill();
    ctx.fillStyle = hexToRgba(effectiveEnemyColor !== enemy.color ? effectiveEnemyColor : headColor, 1);
    ctx.beginPath(); ctx.ellipse(0, 0, w * 0.4, h * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    const eyeWidth = w * 0.2; const eyeHeight = h * 0.25; const eyeY = -h * 0.1; const eyeXOffset = w * 0.15;
    ctx.fillStyle = eyeColor; ctx.beginPath(); ctx.ellipse(-eyeXOffset, eyeY, eyeWidth, eyeHeight, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(eyeXOffset, eyeY, eyeWidth, eyeHeight, 0.2, 0, Math.PI * 2); ctx.fill();
}

export function drawSpikyAlienCanvas(ctx: CanvasRenderingContext2D, enemy: Enemy, effectiveEnemyColor: string) {
    const bodyColor = '#8A2BE2'; const eyeWhiteColor = '#FFFFFF'; const pupilColor = '#000000'; const spikeColor = '#FFD700';
    const w = enemy.width; const h = enemy.height; const coreRadius = Math.min(w, h) * 0.28;
    const numSpikes = 8; ctx.fillStyle = hexToRgba(effectiveEnemyColor !== enemy.color ? effectiveEnemyColor : spikeColor, 0.9);
    ctx.shadowColor = spikeColor; ctx.shadowBlur = 5;
    for (let i = 0; i < numSpikes; i++) {
        const angle = (i / numSpikes) * Math.PI * 2 + ( (enemy.id.charCodeAt(0) || 0) * 0.01 ); 
        const spikeLength = coreRadius * (0.8 + Math.sin( (enemy.id.charCodeAt(1) || 0) *0.1 + i) * 0.1); 
        const spikeWidth = coreRadius * 0.3; ctx.save(); ctx.rotate(angle);
        ctx.beginPath(); ctx.moveTo(coreRadius * 0.8, 0); ctx.lineTo(coreRadius * 0.8 + spikeLength, -spikeWidth / 2); ctx.lineTo(coreRadius * 0.8 + spikeLength, spikeWidth / 2); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    ctx.fillStyle = hexToRgba(effectiveEnemyColor !== enemy.color ? effectiveEnemyColor : bodyColor, 1);
    ctx.beginPath(); ctx.arc(0, 0, coreRadius, 0, Math.PI * 2); ctx.fill();
    const eyeRadius = coreRadius * 0.6; ctx.fillStyle = eyeWhiteColor; ctx.beginPath(); ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pupilColor; ctx.beginPath(); ctx.arc(0, 0, eyeRadius * 0.5, 0, Math.PI * 2); ctx.fill();
}

export function drawMultiTentacleAlienCanvas(ctx: CanvasRenderingContext2D, enemy: Enemy, effectiveEnemyColor: string) {
    const bodyColor = '#FF69B4'; const eyeColor = '#FFFFFF'; const pupilColor = '#000000'; const tentacleColor = '#BA55D3';
    const w = enemy.width; const h = enemy.height; const bodyRadiusX = w * 0.38; const bodyRadiusY = h * 0.32;
    ctx.fillStyle = hexToRgba(effectiveEnemyColor !== enemy.color ? effectiveEnemyColor : bodyColor, 1);
    ctx.beginPath(); ctx.ellipse(0, -h*0.05, bodyRadiusX, bodyRadiusY, 0, 0, Math.PI * 2); ctx.fill();
    const numTentacles = 5; const tentacleLengthBase = h * 0.3;
    ctx.fillStyle = hexToRgba(effectiveEnemyColor !== enemy.color ? effectiveEnemyColor : tentacleColor, 0.9);
    for (let i = 0; i < numTentacles; i++) {
        const angle = (Math.PI / (numTentacles -1)) * i - Math.PI/2 + (Math.PI / (2*(numTentacles-1))); 
        const offsetX = Math.cos(angle * 1.5 + Math.PI/2) * bodyRadiusX * 0.6; 
        const offsetY = Math.sin(angle * 1.5 + Math.PI/2) * bodyRadiusY * 0.3 + bodyRadiusY*0.8;
        const tentacleWidth = w * (0.07 + Math.sin( (enemy.id.charCodeAt(i%enemy.id.length) || 0) *0.1 + i*0.5)*0.01); 
        const tentacleLength = tentacleLengthBase * (0.9 + Math.sin( (enemy.id.charCodeAt((i+1)%enemy.id.length) || 0) *0.1 + i)*0.1); 
        ctx.beginPath(); ctx.moveTo(offsetX, offsetY - tentacleLength*0.2);
        ctx.quadraticCurveTo(offsetX + Math.sin( (enemy.id.charCodeAt((i+2)%enemy.id.length) || 0) *0.1 +i) * tentacleWidth, offsetY + tentacleLength * 0.5, offsetX, offsetY + tentacleLength); 
        ctx.quadraticCurveTo(offsetX - Math.sin( (enemy.id.charCodeAt((i+3)%enemy.id.length) || 0) *0.1 +i) * tentacleWidth, offsetY + tentacleLength * 0.5, offsetX, offsetY - tentacleLength*0.2); 
        ctx.fill();
    }
    const eyeRadius = w * 0.12; const eyeY = -h * 0.15; const eyeXOffset = w * 0.15;
    ctx.fillStyle = eyeColor; ctx.beginPath(); ctx.arc(-eyeXOffset, eyeY, eyeRadius, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(eyeXOffset, eyeY, eyeRadius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pupilColor; ctx.beginPath(); ctx.arc(-eyeXOffset + eyeRadius*0.1, eyeY, eyeRadius * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(eyeXOffset - eyeRadius*0.1, eyeY, eyeRadius * 0.5, 0, Math.PI * 2); ctx.fill();
}

export function drawThreeEyedBossAlienCanvas(ctx: CanvasRenderingContext2D, enemy: Enemy, effectiveEnemyColor: string) {
    const bodyBaseColor = '#4B0082'; const eyeColor = '#00FFFF'; const pupilColor = '#191970'; const toothColor = '#E0FFFF'; const hornColor = '#8A2BE2'; 
    const w = enemy.width; const h = enemy.height; const bodyRadius = Math.min(w,h) * 0.42;
    let currentBodyColor = effectiveEnemyColor !== enemy.color ? effectiveEnemyColor : bodyBaseColor;
    if (enemy.inFuryMode) { currentBodyColor = '#FF00FF'; ctx.shadowColor = '#FF00FF'; ctx.shadowBlur = 20 + Math.sin(Date.now()*0.00) * 5;  
    } else { ctx.shadowColor = '#00FFFF'; ctx.shadowBlur = 10 + Math.sin( (enemy.id.charCodeAt(0) || 0) * 0.1 + Date.now()*0.000)*3;} 
    ctx.fillStyle = currentBodyColor; ctx.beginPath(); ctx.arc(0, 0, bodyRadius, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    ctx.fillStyle = hornColor; const hornWidth = bodyRadius * 0.3; const hornHeight = bodyRadius * 0.6;
    for(let i=-1; i<=1; i+=2) { ctx.beginPath(); ctx.moveTo(bodyRadius * 0.5 * i, -bodyRadius * 0.6); ctx.lineTo(bodyRadius * 0.5 * i - hornWidth * i * 0.5, -bodyRadius * 0.6 - hornHeight * 0.7); ctx.lineTo(bodyRadius * 0.5 * i + hornWidth * i * 0.5, -bodyRadius * 0.6 - hornHeight * 0.7); ctx.lineTo(bodyRadius * 0.5 * i + hornWidth * i, -bodyRadius * 0.6 - hornHeight); ctx.lineTo(bodyRadius * 0.5 * i - hornWidth * i, -bodyRadius * 0.6 - hornHeight); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = pupilColor; ctx.beginPath(); ctx.ellipse(0, bodyRadius * 0.4, bodyRadius * 0.65, bodyRadius * 0.3, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = toothColor; ctx.shadowColor = toothColor; ctx.shadowBlur = 2; const numTeeth = 7;
    for (let i = 0; i < numTeeth; i++) { const toothX = (bodyRadius * 0.55 / (numTeeth -1)) * (i - (numTeeth-1)/2) * 1.9; const toothY = bodyRadius * 0.32 + Math.abs(toothX) * 0.15; ctx.beginPath(); ctx.moveTo(toothX - bodyRadius*0.03, toothY); ctx.lineTo(toothX + bodyRadius*0.03, toothY); ctx.lineTo(toothX, toothY + bodyRadius*0.12); ctx.closePath(); ctx.fill(); }
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    const eyeRadius = bodyRadius * 0.22; const eyeY = -bodyRadius * 0.2; ctx.fillStyle = eyeColor; ctx.shadowColor = eyeColor; ctx.shadowBlur = 7;
    ctx.beginPath(); ctx.arc(0, eyeY, eyeRadius, 0, Math.PI * 2); ctx.fill();
    const sideEyeX = bodyRadius * 0.48; const sideEyeY = -bodyRadius * 0.08;
    ctx.beginPath(); ctx.arc(-sideEyeX, sideEyeY, eyeRadius * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(sideEyeX, sideEyeY, eyeRadius * 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    ctx.fillStyle = pupilColor; ctx.beginPath(); ctx.arc(0, eyeY, eyeRadius * 0.55, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(-sideEyeX + eyeRadius*0.05, sideEyeY, eyeRadius * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(sideEyeX - eyeRadius*0.05, sideEyeY, eyeRadius * 0.5, 0, Math.PI * 2); ctx.fill();
    if (enemy.inFuryMode) { 
      for (let i = 0; i < 5; i++) {
          ctx.fillStyle = `rgba(255, 0, 255, ${0.4 + ((enemy.id.charCodeAt(i%enemy.id.length)||0)*13 % 40)/100.0 })`;
          const angle = ((enemy.id.charCodeAt((i+1)%enemy.id.length)||0)*23 % (Math.PI*200))/100.0;
          const dist = bodyRadius * (1.05 + ((enemy.id.charCodeAt((i+2)%enemy.id.length)||0)*29 % 20)/100.0);
          const size = bodyRadius * (0.05 + ((enemy.id.charCodeAt((i+3)%enemy.id.length)||0)*31 % 50)/1000.0);
          ctx.beginPath(); ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, size, 0, Math.PI * 2); ctx.fill();
      }
    }
}

export function drawHealingDroneCanvas(ctx: CanvasRenderingContext2D, enemy: Enemy, effectiveEnemyColor: string, gameTime: number) {
    const w = enemy.width;
    const h = enemy.height;
    const coreRadius = Math.min(w, h) * 0.4;

    const baseColor1 = '#38761D'; 
    const baseColor2 = '#6AA84F'; 
    const antennaColor = '#A9D18E'; 
    const lensColor = '#D9EAD3'; 

    const blinkOn = Math.floor(gameTime * HEALING_DRONE_BLINK_SPEED) % 2 === 0;
    const bodyColor = blinkOn ? baseColor2 : baseColor1;
    const detailColor = blinkOn ? baseColor1 : baseColor2;

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, coreRadius, coreRadius * 0.75, 0, 0, Math.PI * 2); 
    ctx.fill();

    ctx.strokeStyle = detailColor;
    ctx.lineWidth = w * 0.04;
    ctx.beginPath();
    ctx.moveTo(-coreRadius * 0.6, -coreRadius * 0.3);
    ctx.lineTo(coreRadius * 0.6, -coreRadius * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-coreRadius * 0.4, coreRadius * 0.3);
    ctx.lineTo(coreRadius * 0.4, coreRadius * 0.3);
    ctx.stroke();

    ctx.fillStyle = antennaColor;
    ctx.beginPath();
    ctx.arc(0, -coreRadius * 0.7, w * 0.1, 0, Math.PI * 2); 
    ctx.fill();
    
    ctx.fillStyle = lensColor;
    ctx.shadowColor = blinkOn ? '#B6D7A8' : '#769E6A'; 
    ctx.shadowBlur = blinkOn ? 8 : 4;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    const wingWidth = w * 0.3;
    const wingHeight = h * 0.15;
    ctx.fillStyle = detailColor;
    ctx.beginPath();
    ctx.rect(-coreRadius * 0.8 - wingWidth / 2, -wingHeight / 2, wingWidth, wingHeight);
    ctx.rect(coreRadius * 0.8 - wingWidth / 2, -wingHeight / 2, wingWidth, wingHeight);
    ctx.fill();
}
