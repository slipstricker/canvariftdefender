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
