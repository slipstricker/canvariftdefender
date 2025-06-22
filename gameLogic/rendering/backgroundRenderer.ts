// gameLogic/rendering/backgroundRenderer.ts
import { Star, Nebula } from '../../types';
import { hexToRgba } from '../utils';

export function drawBackground(
    ctx: CanvasRenderingContext2D,
    stars: Readonly<Star[]>,
    nebulae: Readonly<Nebula[]>,
    gameTime: number,
    canvasWidth: number,
    canvasHeight: number
) {
    ctx.fillStyle = '#030712'; // Base space color
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    nebulae.forEach(nebula => {
        ctx.save();
        ctx.translate(nebula.x, nebula.y);
        ctx.rotate(nebula.rotation + gameTime * 0.005); // Slow rotation for nebulae
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(nebula.radiusX, nebula.radiusY));
        grad.addColorStop(0, hexToRgba(nebula.color1, nebula.opacity * 0.7));
        grad.addColorStop(0.5, hexToRgba(nebula.color1, nebula.opacity * 0.4));
        grad.addColorStop(1, hexToRgba(nebula.color2, nebula.opacity * 0.1));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, nebula.radiusX, nebula.radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    stars.forEach(star => {
        const currentOpacity = star.baseOpacity + Math.sin(gameTime * star.twinkleSpeed + star.x) * (star.baseOpacity * 0.5);
        ctx.fillStyle = `rgba(220, 220, 255, ${Math.max(0.1, currentOpacity)})`; // Ensure some base visibility
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
}
