// gameLogic/utils.ts

// Utility function to convert hex color to rgba
export function hexToRgba(hex: string, alpha: number): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) { // #RGB
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) { // #RRGGBB
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  } else {
    // Fallback for invalid hex (e.g., if color name is passed)
    // console.warn(`Invalid hex color: ${hex} in hexToRgba. Defaulting to black.`);
    return `rgba(0,0,0,${alpha})`;
  }
  return `rgba(${r},${g},${b},${alpha})`;
}

// Helper function to get damage color
export function getDamageColor(currentDamage: number, minDamage: number, maxDamage: number): string {
  if (maxDamage <= minDamage) {
    return '#FFFFFF'; // White if range is invalid or single point
  }
  // Clamp currentDamage to be within min/max for normalization to avoid issues
  const clampedDamage = Math.max(minDamage, Math.min(currentDamage, maxDamage));

  if (clampedDamage <= minDamage) return '#FFFFFF'; // White for min
  if (clampedDamage >= maxDamage) return '#FF0000'; // Red for max

  const normalized = (clampedDamage - minDamage) / (maxDamage - minDamage);

  let r: number, g: number, b: number;
  // White (255,255,255) -> Yellow (255,255,0) -> Orange (255,165,0) -> Red (255,0,0)
  if (normalized < 0.333) { // White to Yellow
    const stageNormalized = normalized / 0.333;
    r = 255;
    g = 255;
    b = Math.floor(255 - 255 * stageNormalized);
  } else if (normalized < 0.666) { // Yellow to Orange
    const stageNormalized = (normalized - 0.333) / 0.333;
    r = 255;
    g = Math.floor(255 - (255 - 165) * stageNormalized);
    b = 0;
  } else { // Orange to Red
    const stageNormalized = (normalized - 0.666) / 0.334;
    r = 255;
    g = Math.floor(165 - 165 * stageNormalized);
    b = 0;
  }
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function verticalLineIntersectsRect(lineX: number, rect: {x: number, y: number, width: number, height: number}): boolean {
    return lineX >= rect.x && lineX <= rect.x + rect.width;
}

// Helper to check if a color is "dark"
export function isColorDark(hexColor: string): boolean {
    if (!hexColor || typeof hexColor !== 'string' || hexColor.length < 4 || !hexColor.startsWith('#')) return false; // Default to not dark if invalid
    let r = 0, g = 0, b = 0;
    try {
        if (hexColor.length === 4) { // #RGB
            r = parseInt(hexColor[1] + hexColor[1], 16);
            g = parseInt(hexColor[2] + hexColor[2], 16);
            b = parseInt(hexColor[3] + hexColor[3], 16);
        } else if (hexColor.length === 7) { // #RRGGBB
            r = parseInt(hexColor.substring(1, 3), 16);
            g = parseInt(hexColor.substring(3, 5), 16);
            b = parseInt(hexColor.substring(5, 7), 16);
        } else {
            return false; // Not a valid hex for this check
        }
    } catch (e) {
        // console.warn("Error parsing hex in isColorDark:", e);
        return false; // Parsing error
    }
    // Calculate HSP (Highly Sensitive Poo) brightness
    // http://alienryderflex.com/hsp.html
    const hsp = Math.sqrt(
      0.299 * (r * r) +
      0.587 * (g * g) +
      0.114 * (b * b)
    );
    return hsp < 128; // Threshold for darkness, can be adjusted
}

export function parseAbilityWaveConfig(configString: string | undefined, currentWave: number): boolean {
  if (!configString) {
    return false;
  }
  const lowerConfig = configString.toLowerCase().trim();
  if (lowerConfig === "all") {
    return true;
  }
  try {
    const waves = lowerConfig.split(',').map(w => {
        const num = parseInt(w.trim(), 10);
        if (isNaN(num)) throw new Error(`Invalid number in wave config: ${w.trim()}`);
        return num;
    });
    return waves.includes(currentWave);
  } catch (e) {
    console.warn(`Could not parse wave config string: "${configString}"`, e);
    return false;
  }
}

// Line segment (p0x,p0y)-(p1x,p1y) vs Axis-Aligned Rectangle (rectX,rectY,rectW,rectH)
export function lineIntersectsRect(
    p0x: number, p0y: number, p1x: number, p1y: number,
    rectX: number, rectY: number, rectW: number, rectH: number
): boolean {
    const minX = Math.min(p0x, p1x);
    const maxX = Math.max(p0x, p1x);
    const minY = Math.min(p0y, p1y);
    const maxY = Math.max(p0y, p1y);

    const rectMinX = rectX;
    const rectMaxX = rectX + rectW;
    const rectMinY = rectY;
    const rectMaxY = rectY + rectH;

    // Check if line segment's bounding box intersects rectangle's bounding box
    if (maxX < rectMinX || minX > rectMaxX || maxY < rectMinY || minY > rectMaxY) {
        return false; // No intersection if bounding boxes don't overlap
    }

    // Check if any of the line segment's endpoints are inside the rectangle
    if ((p0x >= rectMinX && p0x <= rectMaxX && p0y >= rectMinY && p0y <= rectMaxY) ||
        (p1x >= rectMinX && p1x <= rectMaxX && p1y >= rectMinY && p1y <= rectMaxY)) {
        return true;
    }

    // Check intersection of the line segment with each of the 4 edges of the rectangle
    // Top edge
    if (lineIntersectsLine(p0x, p0y, p1x, p1y, rectMinX, rectMinY, rectMaxX, rectMinY)) return true;
    // Bottom edge
    if (lineIntersectsLine(p0x, p0y, p1x, p1y, rectMinX, rectMaxY, rectMaxX, rectMaxY)) return true;
    // Left edge
    if (lineIntersectsLine(p0x, p0y, p1x, p1y, rectMinX, rectMinY, rectMinX, rectMaxY)) return true;
    // Right edge
    if (lineIntersectsLine(p0x, p0y, p1x, p1y, rectMaxX, rectMinY, rectMaxX, rectMaxY)) return true;

    return false;
}

// Helper: Checks if two line segments (p0x,p0y)-(p1x,p1y) and (p2x,p2y)-(p3x,p3y) intersect
function lineIntersectsLine(p0x: number, p0y: number, p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number): boolean {
    const s1_x = p1x - p0x;
    const s1_y = p1y - p0y;
    const s2_x = p3x - p2x;
    const s2_y = p3y - p2y;

    const s = (-s1_y * (p0x - p2x) + s1_x * (p0y - p2y)) / (-s2_x * s1_y + s1_x * s2_y);
    const t = ( s2_x * (p0y - p2y) - s2_y * (p0x - p2x)) / (-s2_x * s1_y + s1_x * s2_y);

    return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}
