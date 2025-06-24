// gameLogic/rendering/backgroundRenderer.ts
import { Star, Nebula } from '../../types';
import { hexToRgba } from '../utils';

let backgroundImage: HTMLImageElement | null = null;
let backgroundImageLoadingStarted: boolean = false;
let backgroundImageError: boolean = false;

const BACKGROUND_IMAGE_PATH = 'https://i.imgur.com/QGjB6pL.png'; // Define the path to your image

export function drawBackground(
    ctx: CanvasRenderingContext2D,
    stars: Readonly<Star[]>,
    nebulae: Readonly<Nebula[]>,
    gameTime: number,
    canvasWidth: number,
    canvasHeight: number
) {
    // Attempt to load the background image once
    if (!backgroundImage && !backgroundImageLoadingStarted && !backgroundImageError) {
        backgroundImageLoadingStarted = true;
        const img = new Image();
        img.onload = () => {
            backgroundImage = img;
            console.log("Background image loaded successfully.");
        };
        img.onerror = () => {
            backgroundImageError = true;
            console.error("Failed to load background image. Falling back to solid color.");
        };
        img.src = BACKGROUND_IMAGE_PATH;
    }

    // Draw background: image if loaded, otherwise fallback color
    if (backgroundImage && backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
    } else {
        // Fallback solid color background if image not loaded or error
        ctx.fillStyle = '#030712'; // Base space color
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Draw Nebulae (on top of background image or color)
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

    // Draw Stars (on top of background image or color, and nebulae)
    stars.forEach(star => {
        const currentOpacity = star.baseOpacity + Math.sin(gameTime * star.twinkleSpeed + star.x) * (star.baseOpacity * 0.5);
        ctx.fillStyle = `rgba(220, 220, 255, ${Math.max(0.1, currentOpacity)})`; // Ensure some base visibility
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
}
