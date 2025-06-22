// gameLogic/rendering/platformRenderer.ts
import { Platform } from '../../types';
import { drawGroundPlatformCanvas, drawDynamicPlatformCanvas } from '../canvasArt';

export function drawPlatforms(
    ctx: CanvasRenderingContext2D,
    platforms: Readonly<Platform[]>,
    gameTime: number
) {
    platforms.forEach(p => {
        if (!p.isVisible || p.currentAlpha < 0.1) return; // Don't draw fully transparent platforms
        ctx.save();
        ctx.globalAlpha = p.currentAlpha;
        ctx.imageSmoothingEnabled = true; // Ensure smoothing is enabled for platform art

        if (p.id === 'ground') {
            drawGroundPlatformCanvas(ctx, p, gameTime);
        } else {
            drawDynamicPlatformCanvas(ctx, p, gameTime);
        }
        ctx.restore(); // Restore globalAlpha and other states
    });
}
