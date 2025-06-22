
// gameLogic/rendering/hudRenderer.ts
import { Player, DisplayedSkillInfo, Platform, MouseState, GameState, WaveStatus, AdminConfig, CenterScreenMessage } from '../../types';
import { hexToRgba } from '../utils'; // Ensure this path is correct

export interface HudDrawingTools {
    pixelFontFamily: string;
    canvasWidth: number;
    canvasHeight: number;
}

// Main HUD (HP, XP, Level, Nickname, Coins, Admin, Dash, Wave, Time, Wave Progress)
export function drawHUD(
    ctx: CanvasRenderingContext2D,
    player: Player,
    gameTime: number,
    currentWave: number,
    waveStatus: WaveStatus,
    enemiesToSpawnThisWave: number,
    currentEnemyCount: number, // Non-summoned enemies
    playerCoins: number,
    adminConfig: AdminConfig, // For isAdmin check
    tools: HudDrawingTools,
    displayedSkills: Readonly<DisplayedSkillInfo[]>,
    platforms: Readonly<Platform[]>,
    skillIconRectsOnCanvasRef: React.MutableRefObject<Array<{ id: string, name: string, rect: { x: number, y: number, w: number, h: number } }>>
) {
    const { pixelFontFamily, canvasWidth, canvasHeight } = tools;
    skillIconRectsOnCanvasRef.current = []; // Clear for new frame

    // Dynamic scaling for HUD elements based on canvas size
    const BAR_WIDTH = 200 * (canvasWidth / 1100);
    const BAR_HEIGHT = 18 * (canvasHeight / 650);
    const BAR_X = 20 * (canvasWidth / 1100);
    const BAR_Y_OFFSET_HP = 15 * (canvasHeight / 650);
    const BAR_Y_OFFSET_EXP = BAR_Y_OFFSET_HP + BAR_HEIGHT + (2 * (canvasHeight / 650)) + 10 * (canvasHeight / 650); // Increased spacing
    const BAR_BORDER = 2 * Math.min(canvasWidth / 1100, canvasHeight / 650);
    const FONT_SIZE_SMALL = Math.round(9 * Math.min(canvasWidth / 1100, canvasHeight / 650));
    const FONT_SIZE_MEDIUM = Math.round(11 * Math.min(canvasWidth / 1100, canvasHeight / 650));
    const HUD_TEXT_COLOR = '#E0FFFF';
    const HP_BAR_COLOR = '#FF007F'; // Vibrant Pink
    const EXP_BAR_COLOR = '#00FFFF'; // Bright Cyan
    const BAR_BG_COLOR = 'rgba(10, 20, 50, 0.7)'; // Dark Blue translucent
    const BAR_BORDER_COLOR = '#4A00E0'; // Purple glow
    const BOX_SPACING = 10 * (canvasHeight / 650);

    // --- HP Bar ---
    ctx.fillStyle = BAR_BG_COLOR;
    ctx.fillRect(BAR_X - BAR_BORDER, BAR_Y_OFFSET_HP - BAR_BORDER, BAR_WIDTH + BAR_BORDER * 2, BAR_HEIGHT + BAR_BORDER * 2);
    ctx.fillStyle = HP_BAR_COLOR;
    ctx.fillRect(BAR_X, BAR_Y_OFFSET_HP, BAR_WIDTH * (player.hp / player.maxHp), BAR_HEIGHT);
    ctx.strokeStyle = BAR_BORDER_COLOR; ctx.lineWidth = BAR_BORDER;
    ctx.shadowColor = BAR_BORDER_COLOR; ctx.shadowBlur = BAR_BORDER * 2;
    ctx.strokeRect(BAR_X - BAR_BORDER, BAR_Y_OFFSET_HP - BAR_BORDER, BAR_WIDTH + BAR_BORDER * 2, BAR_HEIGHT + BAR_BORDER * 2);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    ctx.fillStyle = HUD_TEXT_COLOR; ctx.font = `${FONT_SIZE_SMALL}px ${pixelFontFamily}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHp}`, BAR_X + BAR_WIDTH / 2, BAR_Y_OFFSET_HP + BAR_HEIGHT / 2);

    // --- EXP Bar ---
    ctx.fillStyle = BAR_BG_COLOR;
    ctx.fillRect(BAR_X - BAR_BORDER, BAR_Y_OFFSET_EXP - BAR_BORDER, BAR_WIDTH + BAR_BORDER * 2, BAR_HEIGHT + BAR_BORDER * 2);
    ctx.fillStyle = EXP_BAR_COLOR;
    ctx.fillRect(BAR_X, BAR_Y_OFFSET_EXP, BAR_WIDTH * (player.exp / player.xpToNextLevel), BAR_HEIGHT);
    ctx.strokeStyle = BAR_BORDER_COLOR; ctx.shadowColor = BAR_BORDER_COLOR; ctx.shadowBlur = BAR_BORDER * 2;
    ctx.strokeRect(BAR_X - BAR_BORDER, BAR_Y_OFFSET_EXP - BAR_BORDER, BAR_WIDTH + BAR_BORDER * 2, BAR_HEIGHT + BAR_BORDER * 2);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    ctx.fillStyle = '#0A0F1A'; // Darker text for EXP bar contrast
    ctx.fillText(`EXP: ${player.exp}/${player.xpToNextLevel}`, BAR_X + BAR_WIDTH / 2, BAR_Y_OFFSET_EXP + BAR_HEIGHT / 2);

    // --- Level & Nickname Box ---
    const LEVEL_NICK_BOX_Y = BAR_Y_OFFSET_EXP + BAR_HEIGHT + BAR_BORDER * 2 + BOX_SPACING;
    const LEVEL_NICK_BOX_HEIGHT = BAR_HEIGHT * 1.3;
    ctx.fillStyle = BAR_BG_COLOR;
    ctx.fillRect(BAR_X - BAR_BORDER, LEVEL_NICK_BOX_Y - BAR_BORDER, BAR_WIDTH + BAR_BORDER * 2, LEVEL_NICK_BOX_HEIGHT + BAR_BORDER * 2);
    ctx.strokeStyle = BAR_BORDER_COLOR; ctx.shadowColor = BAR_BORDER_COLOR; ctx.shadowBlur = BAR_BORDER * 2;
    ctx.strokeRect(BAR_X - BAR_BORDER, LEVEL_NICK_BOX_Y - BAR_BORDER, BAR_WIDTH + BAR_BORDER * 2, LEVEL_NICK_BOX_HEIGHT + BAR_BORDER * 2);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

    ctx.fillStyle = HUD_TEXT_COLOR;
    ctx.font = `${FONT_SIZE_SMALL}px ${pixelFontFamily}`;
    ctx.textAlign = 'left';
    const textPaddingInsideBox = BAR_HEIGHT * 0.2;
    ctx.fillText(`Nvl: ${player.level}`, BAR_X + textPaddingInsideBox, LEVEL_NICK_BOX_Y + LEVEL_NICK_BOX_HEIGHT * 0.33);
    ctx.fillText(`${player.nickname.substring(0, 12)}${player.nickname.length > 12 ? '...' : ''}`, BAR_X + textPaddingInsideBox, LEVEL_NICK_BOX_Y + LEVEL_NICK_BOX_HEIGHT * 0.73);

    let currentYOffset = LEVEL_NICK_BOX_Y + LEVEL_NICK_BOX_HEIGHT + BAR_BORDER * 2 + BOX_SPACING;

    // --- Coins Box ---
    ctx.fillStyle = BAR_BG_COLOR;
    ctx.fillRect(BAR_X - BAR_BORDER, currentYOffset - BAR_BORDER, BAR_WIDTH + BAR_BORDER * 2, BAR_HEIGHT + BAR_BORDER * 2);
    ctx.strokeStyle = BAR_BORDER_COLOR; ctx.shadowColor = BAR_BORDER_COLOR; ctx.shadowBlur = BAR_BORDER * 2;
    ctx.strokeRect(BAR_X - BAR_BORDER, currentYOffset - BAR_BORDER, BAR_WIDTH + BAR_BORDER * 2, BAR_HEIGHT + BAR_BORDER * 2);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

    ctx.font = `bold ${FONT_SIZE_SMALL}px ${pixelFontFamily}`;
    ctx.fillStyle = '#FFD700'; // Gold color for coins
    ctx.textAlign = 'center';
    ctx.fillText(`Moedas: ${playerCoins} 💰`, BAR_X + BAR_WIDTH / 2, currentYOffset + BAR_HEIGHT / 2);
    currentYOffset += BAR_HEIGHT + BAR_BORDER * 2 + BOX_SPACING;

    // --- Admin Tag Box (Conditional) ---
    if (player.isAdmin) {
        const ADMIN_BOX_WIDTH = BAR_WIDTH * 0.7; // Smaller box for admin tag
        const ADMIN_BOX_HEIGHT = BAR_HEIGHT * 0.9;
        ctx.fillStyle = BAR_BG_COLOR;
        ctx.fillRect(BAR_X - BAR_BORDER, currentYOffset - BAR_BORDER, ADMIN_BOX_WIDTH + BAR_BORDER * 2, ADMIN_BOX_HEIGHT + BAR_BORDER * 2);
        ctx.strokeStyle = BAR_BORDER_COLOR; ctx.shadowColor = BAR_BORDER_COLOR; ctx.shadowBlur = BAR_BORDER * 2;
        ctx.strokeRect(BAR_X - BAR_BORDER, currentYOffset - BAR_BORDER, ADMIN_BOX_WIDTH + BAR_BORDER * 2, ADMIN_BOX_HEIGHT + BAR_BORDER * 2);
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

        ctx.fillStyle = '#FFD700'; // Gold color for admin tag
        ctx.font = `${FONT_SIZE_SMALL}px ${pixelFontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText(`(Debug)`, BAR_X + ADMIN_BOX_WIDTH / 2, currentYOffset + ADMIN_BOX_HEIGHT / 2);
        currentYOffset += ADMIN_BOX_HEIGHT + BAR_BORDER * 2 + BOX_SPACING;
    }

    // --- Dash Cooldown Bar (Conditional) ---
    if (player.hasDashSkill) {
        const dashCooldownBarWidth = BAR_WIDTH * 0.7; // Consistent size
        const dashCooldownBarHeight = BAR_HEIGHT * 0.9;

        ctx.fillStyle = BAR_BG_COLOR;
        ctx.fillRect(BAR_X - BAR_BORDER, currentYOffset - BAR_BORDER, dashCooldownBarWidth + BAR_BORDER * 2, dashCooldownBarHeight + BAR_BORDER * 2);

        const dashReady = performance.now() - (player.lastDashTimestamp || 0) > (player.dashCooldownTime || 30) * 1000;
        let dashProgress = 1;
        if (!dashReady) {
            dashProgress = (performance.now() - (player.lastDashTimestamp || 0)) / ((player.dashCooldownTime || 30) * 1000);
        }
        dashProgress = Math.max(0, Math.min(1, dashProgress));

        ctx.fillStyle = dashReady ? '#00FF7F' : '#FFD700'; // Green when ready, Yellow when cooling down
        ctx.fillRect(BAR_X, currentYOffset, dashCooldownBarWidth * dashProgress, dashCooldownBarHeight);

        ctx.strokeStyle = BAR_BORDER_COLOR; ctx.lineWidth = BAR_BORDER;
        ctx.shadowColor = BAR_BORDER_COLOR; ctx.shadowBlur = BAR_BORDER * 2;
        ctx.strokeRect(BAR_X - BAR_BORDER, currentYOffset - BAR_BORDER, dashCooldownBarWidth + BAR_BORDER * 2, dashCooldownBarHeight + BAR_BORDER * 2);
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

        ctx.fillStyle = dashReady ? '#0A0F1A' : HUD_TEXT_COLOR; // Dark text on green, light on yellow
        ctx.font = `${FONT_SIZE_SMALL - 1}px ${pixelFontFamily}`; // Slightly smaller font for dash bar
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const dashCooldownRemaining = (((player.dashCooldownTime || 30) * 1000 - (performance.now() - (player.lastDashTimestamp || 0))) / 1000);
        ctx.fillText(dashReady ? "Dash!" : `Espera: ${Math.max(0, dashCooldownRemaining).toFixed(1)}s`, BAR_X + dashCooldownBarWidth / 2, currentYOffset + dashCooldownBarHeight / 2);
    }
    ctx.textBaseline = 'alphabetic'; // Reset

    // --- Wave & Time Info ---
    const TEXT_Y_WAVE_INFO_TOP = 28 * (canvasHeight / 650);
    const TEXT_Y_TIME_INFO_TOP = 50 * (canvasHeight / 650);
    ctx.textAlign = 'right'; ctx.fillStyle = HUD_TEXT_COLOR;
    ctx.font = `${FONT_SIZE_MEDIUM}px ${pixelFontFamily}`;
    ctx.shadowColor = HUD_TEXT_COLOR; ctx.shadowBlur = 3;
    ctx.fillText(`Wave: ${currentWave > 0 ? currentWave : '-'}`, canvasWidth - 20 * (canvasWidth / 1100), TEXT_Y_WAVE_INFO_TOP);
    ctx.fillText(`Tempo: ${Math.floor(gameTime)}s`, canvasWidth - 20 * (canvasWidth / 1100), TEXT_Y_TIME_INFO_TOP);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;


    // --- Wave Progress Bar ---
    const WAVE_PROGRESS_BAR_WIDTH = canvasWidth * 0.4;
    const WAVE_PROGRESS_BAR_HEIGHT = 18 * (canvasHeight / 650);
    const WAVE_PROGRESS_BAR_X = (canvasWidth - WAVE_PROGRESS_BAR_WIDTH) / 2;
    const WAVE_PROGRESS_BAR_Y = 15 * (canvasHeight / 650);
    const WAVE_PROGRESS_BAR_BG_COLOR = 'rgba(10, 20, 50, 0.7)';
    const WAVE_PROGRESS_BAR_FILL_COLOR = '#00FFFF'; // Cyan
    const WAVE_PROGRESS_BAR_BORDER_COLOR = '#4A00E0'; // Purple glow
    const WAVE_PROGRESS_BAR_BORDER_WIDTH = 2;
    const WAVE_PROGRESS_TEXT_COLOR = '#E0FFFF';
    const WAVE_PROGRESS_FONT_SIZE = FONT_SIZE_SMALL;

    if (waveStatus === 'lutando' && currentWave > 0) {
        let waveProgressPercentage = 0;
        if (enemiesToSpawnThisWave > 0) {
            waveProgressPercentage = (enemiesToSpawnThisWave - currentEnemyCount) / enemiesToSpawnThisWave;
        }
        waveProgressPercentage = Math.max(0, Math.min(1, waveProgressPercentage));

        ctx.fillStyle = WAVE_PROGRESS_BAR_BG_COLOR;
        ctx.fillRect(WAVE_PROGRESS_BAR_X, WAVE_PROGRESS_BAR_Y, WAVE_PROGRESS_BAR_WIDTH, WAVE_PROGRESS_BAR_HEIGHT);

        ctx.fillStyle = WAVE_PROGRESS_BAR_FILL_COLOR;
        ctx.fillRect(WAVE_PROGRESS_BAR_X, WAVE_PROGRESS_BAR_Y, WAVE_PROGRESS_BAR_WIDTH * waveProgressPercentage, WAVE_PROGRESS_BAR_HEIGHT);

        ctx.strokeStyle = WAVE_PROGRESS_BAR_BORDER_COLOR;
        ctx.lineWidth = WAVE_PROGRESS_BAR_BORDER_WIDTH;
        ctx.shadowColor = WAVE_PROGRESS_BAR_BORDER_COLOR;
        ctx.shadowBlur = 5;
        ctx.strokeRect(WAVE_PROGRESS_BAR_X - WAVE_PROGRESS_BAR_BORDER_WIDTH / 2,
            WAVE_PROGRESS_BAR_Y - WAVE_PROGRESS_BAR_BORDER_WIDTH / 2,
            WAVE_PROGRESS_BAR_WIDTH + WAVE_PROGRESS_BAR_BORDER_WIDTH,
            WAVE_PROGRESS_BAR_HEIGHT + WAVE_PROGRESS_BAR_BORDER_WIDTH);
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        ctx.lineWidth = 1; // Reset line width

        ctx.font = `${WAVE_PROGRESS_FONT_SIZE}px ${pixelFontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = WAVE_PROGRESS_TEXT_COLOR;
        ctx.fillText(`Progresso da Wave: ${Math.round(waveProgressPercentage * 100)}%`, WAVE_PROGRESS_BAR_X + WAVE_PROGRESS_BAR_WIDTH / 2, WAVE_PROGRESS_BAR_Y + WAVE_PROGRESS_BAR_HEIGHT / 2);
        ctx.textBaseline = 'alphabetic'; // Reset baseline
    }

    // Acquired Skill Icons on Canvas
    if (displayedSkills.length > 0) {
        const groundPlatform = platforms.find(p => p.id === 'ground');
        if (groundPlatform) {
            const sizeReductionFactor = 0.8; // Reduce size by 20%
            let currentIconX = groundPlatform.x + (30 * (canvasWidth / 1100)) * sizeReductionFactor; 
            const iconCharSize = (26 * (Math.min(canvasWidth / 1100, canvasHeight / 650))) * sizeReductionFactor;
            const internalPadding = (6 * (Math.min(canvasWidth / 1100, canvasHeight / 650))) * sizeReductionFactor;
            const iconBoxBorder = (2 * (Math.min(canvasWidth / 1100, canvasHeight / 650))) * sizeReductionFactor;
            const spacingBetweenIconAndCount = (7 * (Math.min(canvasWidth / 1100, canvasHeight / 650))) * sizeReductionFactor;
            const spacingBetweenSkills = (14 * (Math.min(canvasWidth / 1100, canvasHeight / 650))) * sizeReductionFactor;
            const skillBgColor = 'rgba(10, 20, 40, 0.7)';
            const skillBorderColor = '#00FFFF'; // Cyan border
            const countTextColor = '#F0E68C'; // Light yellow for count
            const countFontSize = (11 * (Math.min(canvasWidth / 1100, canvasHeight / 650))) * sizeReductionFactor;

            displayedSkills.forEach(skill => {
                if (skill.id === 'immortal' && player.revives <= 0) {
                    return; // Don't draw the "Immortal" icon if no revives are left
                }

                ctx.textAlign = 'left';
                ctx.font = `${iconCharSize}px Arial`; // Use Arial or similar for emoji icons
                const iconMetrics = ctx.measureText(skill.icon);
                const iconCharActualWidth = iconMetrics.width;

                let countText = "";
                let countTextActualWidth = 0;
                if (skill.count > 1) {
                    countText = `x${skill.count}`;
                    ctx.font = `bold ${countFontSize}px ${pixelFontFamily}`;
                    const countTextMetrics = ctx.measureText(countText);
                    countTextActualWidth = countTextMetrics.width;
                }

                const baseContentActualWidth = iconCharActualWidth + (countTextActualWidth > 0 ? spacingBetweenIconAndCount + countTextActualWidth : 0);
                const grayBgWidth = baseContentActualWidth + internalPadding * 2;
                const grayBgHeight = iconCharSize + 2 * internalPadding;

                const totalElementWidth = grayBgWidth + 2 * iconBoxBorder;
                const totalElementHeight = grayBgHeight + 2 * iconBoxBorder;

                const overallElementY = groundPlatform.y + Math.round((groundPlatform.height - totalElementHeight) / 2) - (5 * (canvasHeight / 650)) * sizeReductionFactor;

                ctx.shadowColor = skillBorderColor;
                ctx.shadowBlur = 5 * sizeReductionFactor;
                ctx.strokeStyle = skillBorderColor;
                ctx.lineWidth = iconBoxBorder;
                ctx.strokeRect(currentIconX, overallElementY, totalElementWidth, totalElementHeight);
                ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

                ctx.fillStyle = skillBgColor;
                ctx.fillRect(currentIconX + iconBoxBorder, overallElementY + iconBoxBorder, grayBgWidth, grayBgHeight);

                ctx.font = `${iconCharSize}px Arial`;
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'left';
                ctx.fillStyle = 'white'; // Icon color
                const iconRenderX = currentIconX + iconBoxBorder + internalPadding;
                const contentRenderY = overallElementY + iconBoxBorder + grayBgHeight / 2;
                ctx.fillText(skill.icon, iconRenderX, contentRenderY);

                if (countTextActualWidth > 0) {
                    ctx.font = `bold ${countFontSize}px ${pixelFontFamily}`;
                    ctx.textAlign = 'left';
                    ctx.fillStyle = countTextColor;
                    const countRenderX = iconRenderX + iconCharActualWidth + spacingBetweenIconAndCount;
                    ctx.fillText(countText, countRenderX, contentRenderY);
                }

                const iconRectForHover = {
                    x: currentIconX,
                    y: overallElementY,
                    w: totalElementWidth,
                    h: totalElementHeight
                };
                skillIconRectsOnCanvasRef.current.push({ id: skill.id, name: skill.name, rect: iconRectForHover });

                currentIconX += totalElementWidth + spacingBetweenSkills;
            });
             ctx.textBaseline = 'alphabetic'; // Reset baseline
        }
    }
}


export function drawCenterScreenMessages(
    ctx: CanvasRenderingContext2D,
    centerScreenMessage: CenterScreenMessage | null,
    pixelFontFamily: string,
    canvasWidth: number,
    canvasHeight: number
) {
    if (centerScreenMessage) {
        const FONT_SIZE_LARGE = Math.round(18 * Math.min(canvasWidth / 1100, canvasHeight / 650));
        const FONT_SIZE_CENTER = centerScreenMessage.fontSize ? Math.round(centerScreenMessage.fontSize * Math.min(canvasWidth / 1100, canvasHeight / 650)) : FONT_SIZE_LARGE;
        
        ctx.font = `bold ${FONT_SIZE_CENTER}px ${pixelFontFamily}`;
        ctx.textAlign = 'center';
        const alpha = Math.min(1, Math.max(0, centerScreenMessage.duration / centerScreenMessage.initialDuration));
        const messageColor = centerScreenMessage.color || '#00FFFF'; // Default to Cyan
        ctx.fillStyle = hexToRgba(messageColor, 0.9 * alpha);
        ctx.shadowColor = hexToRgba(messageColor, 0.7 * alpha);
        ctx.shadowBlur = 5;
        ctx.fillText(centerScreenMessage.text, canvasWidth / 2, canvasHeight / 2 - 60 * (canvasHeight / 650));
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    }
}

export function drawMouseCursor(
    ctx: CanvasRenderingContext2D,
    canvasRefCurrent: HTMLCanvasElement | null,
    mouseStateRefCurrent: MouseState,
    gameStateRefCurrent: GameState,
    canvasWidth: number,
    canvasHeight: number
) {
    if (canvasRefCurrent && gameStateRefCurrent === GameState.Playing) {
        const rect = canvasRefCurrent.getBoundingClientRect();
        // Scale mouse coordinates to internal canvas resolution
        const displayMouseX = (mouseStateRefCurrent.x - rect.left) * (canvasRefCurrent.width / rect.width);
        const displayMouseY = (mouseStateRefCurrent.y - rect.top) * (canvasRefCurrent.height / rect.height);

        ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)'; // Cyan cursor
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(displayMouseX - 10, displayMouseY);
        ctx.lineTo(displayMouseX + 10, displayMouseY);
        ctx.moveTo(displayMouseX, displayMouseY - 10);
        ctx.lineTo(displayMouseX, displayMouseY + 10);
        ctx.stroke();
    }
}

export function drawSkillTooltip(
    ctx: CanvasRenderingContext2D,
    hoveredSkillTooltip: { name: string; x: number; y: number } | null,
    pixelFontFamily: string,
    canvasWidth: number,
    canvasHeight: number
) {
    if (hoveredSkillTooltip) {
        const FONT_SIZE_SMALL = Math.round(9 * Math.min(canvasWidth / 1100, canvasHeight / 650));
        ctx.font = `bold ${FONT_SIZE_SMALL}px ${pixelFontFamily}`;
        const textMetrics = ctx.measureText(hoveredSkillTooltip.name);
        const tooltipWidth = textMetrics.width + 10 * (canvasWidth / 1100); // Scaled padding
        const tooltipHeight = 18 * (canvasHeight / 650); // Scaled height
        let tooltipX = hoveredSkillTooltip.x;
        let tooltipY = hoveredSkillTooltip.y - tooltipHeight - 5 * (canvasHeight / 650); // Scaled offset

        // Adjust tooltip position if it goes off-screen
        if (tooltipX + tooltipWidth > canvasWidth) tooltipX = canvasWidth - tooltipWidth - 2;
        if (tooltipY < 0) tooltipY = hoveredSkillTooltip.y + 15 * (canvasHeight / 650); // Scaled offset

        ctx.fillStyle = 'rgba(5, 10, 30, 0.9)'; // Dark translucent background
        ctx.strokeStyle = '#00FFFF'; ctx.lineWidth = 1; // Cyan border
        ctx.beginPath();
        ctx.rect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#E0FFFF'; // Light Cyan text
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(hoveredSkillTooltip.name, tooltipX + 5 * (canvasWidth / 1100), tooltipY + tooltipHeight / 2); // Scaled text padding
        ctx.textBaseline = 'alphabetic'; // Reset baseline
    }
}
