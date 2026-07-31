/**
 * Minimal per-allergen intensity gradient for story s2 (one allergen). Story s4
 * replaces this with a dataviz-skill-driven, scalable-to-N-allergens palette once
 * the comprehensive allergen dataset (story s3) exists — this is a correct but
 * intentionally simple starting point, not the final palette work.
 */

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s * 100, l * 100];
}

/**
 * value: 0-100 severity. Returns a CSS hsl() string: low severity = a light tint of
 * the allergen's base hue, high severity = a fully saturated, darker shade.
 */
export function intensityColor(baseColorHex: string, value: number): string {
  const [h, s] = hexToHsl(baseColorHex);
  const clamped = Math.max(0, Math.min(100, value));
  // Lightness runs from a pale 92% (near-zero severity) down to 32% (worst).
  const lightness = 92 - (clamped / 100) * 60;
  return `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${lightness.toFixed(1)}%)`;
}

export const NO_DATA_COLOR = "hsl(0 0% 88%)";
