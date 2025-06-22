

// gameLogic/rendering/entityRenderer.ts
import {
    Player, Enemy, Projectile, Particle, ActiveLightningBolt, FloatingText,
    HatItem, StaffItem, MouseState, CoinDrop, ParticleType
} from '../../types';
import {
    drawPlayerCanvas, drawHatCanvas, drawStaffCanvas, drawProjectileCanvas,
    drawCyclopsAlienCanvas, drawGreenClassicAlienCanvas, drawSpikyAlienCanvas,
    drawMultiTentacleAlienCanvas, drawThreeEyedBossAlienCanvas, drawHealingDroneCanvas
} from '../canvasArt';
import { hexToRgba } from '../utils'; // Ensure this path is correct
import { SPRITE_PIXEL_SIZE, BOSS_LASER_CHARGE_TIME_MS } from '../../constants'; // For particle effects, if needed

// Player and Accessories
export function drawPlayerAndAccessories(
    ctx: CanvasRenderingContext2D,
    player: Player,
    gameTime: number,
    mouseState: MouseState,
    canvasRect: DOMRect | null,
    canvasWidth: number,
    canvasHeight: number,
    allHats: Readonly<HatItem[]>,
    allStaffs: Readonly<StaffItem[]>
) {
    ctx.save(); 
    if (player.isInvincible && player.invincibilityDuration === 500) { 
        if (Math.floor(gameTime * 15) % 2 === 0) { 
            ctx.globalAlpha = 0.35;
        } else {
            ctx.globalAlpha = 0.85;
        }
    } else if (player.isInvincible && player.isDashing) {
         ctx.globalAlpha = 0.6; 
    }
     else {
        ctx.globalAlpha = 1.0;
    }

    drawPlayerCanvas(ctx, player, gameTime);

    if (player.selectedHatId) {
        const hatItem = allHats.find(h => h.id === player.selectedHatId);
        if (hatItem) {
            drawHatCanvas(ctx, hatItem, player, gameTime);
        }
    }

    if (player.selectedStaffId) {
        const staffItem = allStaffs.find(s => s.id === player.selectedStaffId);
        if (staffItem) {
            drawStaffCanvas(ctx, staffItem, player, gameTime, mouseState, canvasRect, canvasWidth, canvasHeight);
        }
    }
    ctx.restore(); 

    // Shield
    if (player.shieldMaxHp && typeof player.shieldCurrentHp === 'number' && player.shieldCurrentHp > 0) {
        const shieldCenterX = player.x + player.width / 2;
        const shieldCenterY = player.y + player.height / 2;
        const shieldRadius = Math.max(player.width, player.height) * 0.7; 
        const shieldStrengthAlpha = 0.5 + (player.shieldCurrentHp / player.shieldMaxHp) * 0.5;

        const pulse = Math.sin(gameTime * 5) * 0.1 + 0.9; 
        ctx.strokeStyle = `rgba(0, 220, 255, ${shieldStrengthAlpha * 0.9 * pulse})`;
        ctx.lineWidth = 3 + Math.sin(gameTime * 5 + Math.PI / 2) * 1; 
        ctx.shadowColor = `rgba(0, 220, 255, ${shieldStrengthAlpha * 0.7})`;
        ctx.shadowBlur = 10 + Math.sin(gameTime * 5) * 3; 
        ctx.beginPath();
        ctx.arc(shieldCenterX, shieldCenterY, shieldRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; 

        const gradient = ctx.createRadialGradient(
            shieldCenterX, shieldCenterY, shieldRadius * 0.5,
            shieldCenterX, shieldCenterY, shieldRadius
        );
        gradient.addColorStop(0, `rgba(0, 180, 220, ${shieldStrengthAlpha * 0.1 * pulse})`);
        gradient.addColorStop(1, `rgba(0, 180, 220, ${shieldStrengthAlpha * 0.3 * pulse})`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(shieldCenterX, shieldCenterY, shieldRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1; 
    }
}

// Enemies
export function drawEnemies(
    ctx: CanvasRenderingContext2D,
    enemies: Readonly<Enemy[]>,
    gameTime: number,
    createParticleEffect: (x: number, y: number, count: number, color: string, sizeVariance?: number, speed?: number, life?: number, type?: ParticleType) => void
) {
    enemies.forEach(enemy => {
        if (!enemy) return;
        const centerX = enemy.x + enemy.width / 2;
        const centerY = enemy.y + enemy.height / 2;
        let effectiveEnemyColor = enemy.color;
        const isChilled = enemy.statusEffects.some(se => se.type === 'chill' && se.duration > 0);

        if (isChilled && enemy.enemyType !== 'healing_drone') effectiveEnemyColor = '#00FFFF'; 
        if (enemy.isSummonedByBoss) effectiveEnemyColor = '#7777AA'; 

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.imageSmoothingEnabled = true;

        switch (enemy.visualVariant) {
            case 'cyclops': drawCyclopsAlienCanvas(ctx, enemy, effectiveEnemyColor); break;
            case 'green_classic': drawGreenClassicAlienCanvas(ctx, enemy, effectiveEnemyColor); break;
            case 'spiky': drawSpikyAlienCanvas(ctx, enemy, effectiveEnemyColor); break;
            case 'multi_tentacle': drawMultiTentacleAlienCanvas(ctx, enemy, effectiveEnemyColor); break;
            case 'three_eyed_boss': drawThreeEyedBossAlienCanvas(ctx, enemy, effectiveEnemyColor); break;
            case 'healing_drone': drawHealingDroneCanvas(ctx, enemy, effectiveEnemyColor, gameTime); break;
            default: 
                ctx.fillStyle = effectiveEnemyColor;
                ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
                break;
        }

        // Boss Laser Charging Visual
        if (enemy.enemyType === 'boss' && enemy.isChargingLaser && enemy.laserChargeTimer !== undefined) {
            const chargeProgress = 1 - (enemy.laserChargeTimer / (BOSS_LASER_CHARGE_TIME_MS / 1000)); // 0 to 1
            const chargeColor = `rgba(255, 0, 0, ${0.15 + chargeProgress * 0.5})`; // Fades in red, more subtle
            const chargeRadius = enemy.width * (0.35 + chargeProgress * 0.45); // Starts smaller, grows larger
            
            ctx.fillStyle = chargeColor;
            ctx.beginPath();
            ctx.arc(0, 0, chargeRadius, 0, Math.PI * 2); // Drawn relative to translated boss center
            ctx.fill();

            // Pulsing outline for charging
            const pulseIntensity = 0.5 + Math.sin(gameTime * 15 + chargeProgress * Math.PI) * 0.2; // Faster pulse as it charges
            ctx.strokeStyle = `rgba(255, ${100 - chargeProgress * 50}, ${100 - chargeProgress * 50}, ${0.4 * pulseIntensity + chargeProgress * 0.3})`;
            ctx.lineWidth = (2 + chargeProgress * 4) * pulseIntensity; // Line width also pulses and grows
            ctx.beginPath();
            ctx.arc(0, 0, chargeRadius * (1.05 + chargeProgress * 0.1), 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();

        // HP Bar
        const hpBarY = enemy.y - (enemy.enemyType === 'boss' ? 18 : 12); 
        const hpBarWidth = enemy.width;
        const hpBarHeight = enemy.enemyType === 'boss' ? 9 : 6;
        ctx.fillStyle = 'rgba(0,0,20,0.7)'; 
        ctx.fillRect(enemy.x, hpBarY, hpBarWidth, hpBarHeight);
        ctx.fillStyle = enemy.inFuryMode ? '#FF00FF' : (isChilled ? '#00FFFF' : (enemy.isHealingDrone ? '#90EE90' : '#39FF14')); 
        ctx.fillRect(enemy.x, hpBarY, hpBarWidth * (enemy.hp / enemy.maxHp), hpBarHeight);
        ctx.strokeStyle = '#00AAAA'; 
        ctx.strokeRect(enemy.x, hpBarY, hpBarWidth, hpBarHeight);

        // Status effect particles
        enemy.statusEffects.forEach(effect => {
            if (effect.type === 'burn' && Math.random() < 0.2) {
                createParticleEffect(
                    enemy.x + Math.random() * enemy.width, enemy.y + Math.random() * enemy.height,
                    1, `rgba(255, ${Math.random() * 100 + 100}, 0, ${0.6 + Math.random() * 0.3})`,
                    10 * (SPRITE_PIXEL_SIZE / 3), 
                    30 * (SPRITE_PIXEL_SIZE / 3) * 2.2, 
                    0.25 + Math.random() * 0.2, 'status_burn'
                );
            } else if (effect.type === 'chill' && Math.random() < 0.15) {
                createParticleEffect(
                    enemy.x + Math.random() * enemy.width, enemy.y + Math.random() * enemy.height,
                    1, `rgba(0, 220, 255, ${0.5 + Math.random() * 0.3})`,
                    12 * (SPRITE_PIXEL_SIZE / 3), 
                    20 * (SPRITE_PIXEL_SIZE / 3) * 2.2, 
                    0.35 + Math.random() * 0.2, 'status_chill'
                );
            }
        });
    });
}

// Projectiles
export function drawProjectiles(
    ctx: CanvasRenderingContext2D,
    playerProjectiles: Readonly<Projectile[]>,
    enemyProjectiles: Readonly<Projectile[]>,
    gameTime: number
) {
    playerProjectiles.forEach(p => {
        drawProjectileCanvas(ctx, p, gameTime);
    });

    enemyProjectiles.forEach(p => {
        if (p.appliedEffectType === 'boss_laser') {
            drawProjectileCanvas(ctx, p, gameTime); // Use the dedicated drawing logic for laser
        } else {
            const eCenterX = p.x + p.width / 2;
            const eCenterY = p.y + p.height / 2;
            const coreRadius = p.width * 0.25;
            const glowRadius = p.width * 0.45;

            const enemyProjColor = '#FF00AA'; 
            ctx.shadowColor = enemyProjColor; ctx.shadowBlur = 5;
            ctx.fillStyle = hexToRgba(enemyProjColor, 0.5); 
            ctx.beginPath();
            ctx.arc(eCenterX, eCenterY, glowRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = enemyProjColor; 
            ctx.beginPath();
            ctx.arc(eCenterX, eCenterY, coreRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        }
    });
}

// Particles
export function drawParticles(
    ctx: CanvasRenderingContext2D,
    particles: Readonly<Particle[]>,
    gameTime: number,
    pixelFontFamily: string 
) {
    particles.forEach(p => {
        const alpha = Math.max(0, (p.initialLife && p.life > 0 ? p.life / p.initialLife : 0.5));
        const radius = p.width / 2; 
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;

        switch (p.particleType) {
            case 'explosion':
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius * (1 + (1 - alpha) * 2), 0, Math.PI * 2); 
                ctx.globalCompositeOperation = 'lighter'; 
                ctx.fill();
                ctx.globalCompositeOperation = 'source-over'; 
                break;
            case 'status_burn':
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius * (0.5 + Math.random() * 0.5), 0, Math.PI * 2); 
                ctx.fill();
                break;
            case 'status_chill':
                const numShards = 3 + Math.floor(Math.random() * 2);
                ctx.beginPath();
                for (let i = 0; i < numShards; i++) {
                    const angle = (i / numShards) * Math.PI * 2 + (p.rotation || 0);
                    const length = radius * (0.7 + Math.random() * 0.3);
                    ctx.moveTo(p.x + Math.cos(angle) * length * 0.3, p.y + Math.sin(angle) * length * 0.3);
                    ctx.lineTo(p.x + Math.cos(angle) * length, p.y + Math.sin(angle) * length);
                }
                ctx.strokeStyle = p.color; 
                ctx.lineWidth = radius * 0.2; 
                ctx.stroke();
                break;
            case 'coin_pickup':
                ctx.font = `bold ${radius * 2}px ${pixelFontFamily}`; 
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('💰', p.x, p.y);
                break;
            case 'dash_trail':
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, radius * (1 + Math.random() * 0.5), radius * (0.5 + Math.random() * 0.3), Math.random() * Math.PI, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'heal_pulse':
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius * (alpha + 0.2), 0, Math.PI * 2); 
                ctx.fill();
                break;
            case 'boss_laser_charge':
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius * (0.8 + Math.random() * 0.4) * (1 - alpha*0.5), 0, Math.PI * 2); // Shrink slightly over life
                ctx.fill();
                break;
            case 'player_double_jump':
            case 'player_land_dust':
            case 'shield_hit':
            case 'generic':
            default:
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        ctx.restore();
    });
}

// Coin Drops
export function drawCoinDrops(
    ctx: CanvasRenderingContext2D,
    coinDrops: Readonly<CoinDrop[]>,
    gameTime: number,
    pixelFontFamily: string
) {
    coinDrops.forEach(coin => {
        const bobOffset = Math.sin(gameTime * 4 + (coin.id.charCodeAt(0) % 10)) * (coin.height * 0.07); 
        const scalePulse = 1 + Math.sin(gameTime * 5 + (coin.id.charCodeAt(1) % 10)) * 0.05; 

        ctx.font = `bold ${coin.height * 0.9 * scalePulse}px ${pixelFontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFD700'; 

        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowOffsetX = 1 * scalePulse;
        ctx.shadowOffsetY = 1 * scalePulse;
        ctx.shadowBlur = 2 * scalePulse;

        ctx.fillText('💰', coin.x + coin.width / 2, coin.y + coin.height / 2 + bobOffset);

        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;
    });
}

// Active Lightning Bolts
export function drawActiveLightningBolts(
    ctx: CanvasRenderingContext2D,
    activeLightningBolts: Readonly<ActiveLightningBolt[]>
) {
    activeLightningBolts.forEach(bolt => {
        const alpha = Math.max(0, bolt.life / bolt.initialLife); 
        const numSegments = 5; 
        const segmentLengthX = (bolt.endX - bolt.startX) / numSegments;
        const segmentLengthY = (bolt.endY - bolt.startY) / numSegments;
        const maxPerpendicularOffset = 15; 

        ctx.lineCap = 'round';
        const boltPath = new Path2D();
        boltPath.moveTo(bolt.startX, bolt.startY);
        for (let i = 1; i < numSegments; i++) {
            const nodeX = bolt.startX + segmentLengthX * i;
            const nodeY = bolt.startY + segmentLengthY * i;
            let dxSeg = segmentLengthX; let dySeg = segmentLengthY;
            const lenSeg = Math.sqrt(dxSeg * dxSeg + dySeg * dySeg) || 1;
            dxSeg /= lenSeg; dySeg /= lenSeg;
            const perpX = -dySeg; 
            const perpY = dxSeg;  
            const offsetMagnitude = (Math.random() - 0.5) * 2 * maxPerpendicularOffset * (1 - Math.abs(i - numSegments / 2) / (numSegments / 2));
            boltPath.lineTo(nodeX + perpX * offsetMagnitude, nodeY + perpY * offsetMagnitude);
        }
        boltPath.lineTo(bolt.endX, bolt.endY);

        ctx.lineWidth = 18 + Math.random() * 12; 
        ctx.strokeStyle = `rgba(0, 220, 255, ${alpha * 0.15 * (0.4 + Math.random() * 0.4)})`;
        ctx.stroke(boltPath);
        ctx.lineWidth = 7 + Math.random() * 5; 
        ctx.strokeStyle = `rgba(200, 240, 255, ${alpha * 0.4 * (0.5 + Math.random() * 0.4)})`;
        ctx.stroke(boltPath);
        ctx.lineWidth = 2.5 + Math.random() * 2; 
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9 * (0.7 + Math.random() * 0.3)})`;
        ctx.stroke(boltPath);
    });
}

// Floating Texts
export function drawFloatingTexts(
    ctx: CanvasRenderingContext2D,
    floatingTexts: Readonly<FloatingText[]>,
    pixelFontFamily: string
) {
    floatingTexts.forEach(ft => {
        const alpha = Math.max(0, ft.life / ft.initialLife); 
        ctx.font = `bold ${ft.fontSize}px ${pixelFontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = ft.color.startsWith('#') ? hexToRgba(ft.color, alpha) : `rgba(255,255,255, ${alpha})`; 

        if (ft.color.startsWith('#')) {
            ctx.shadowColor = hexToRgba(ft.color, alpha * 0.7);
        } else {
            ctx.shadowColor = `rgba(0,0,0, ${alpha * 0.3})`;
        }
        ctx.shadowBlur = 3;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; 
    });
}