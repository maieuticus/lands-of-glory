/**
 * UI Scale utility for consistent sizing across all menus and windows
 */

export type UISize = 'small' | 'medium' | 'large';

export const UI_SCALE_FACTORS: Record<UISize, number> = {
  small: 0.75,
  medium: 0.9,
  large: 1.0,
};

/**
 * Apply UI scale to document root as CSS custom property
 */
export function applyUIScale(size: UISize): void {
  const scale = UI_SCALE_FACTORS[size] || 1.0;
  document.documentElement.style.setProperty('--ui-scale', scale.toString());
  console.log('🔧 UI Scale applied:', size, '(' + scale + ')');
}

/**
 * Get scaled CSS value
 */
export function scale(value: number): string {
  return `calc(${value}px * var(--ui-scale, 1))`;
}

/**
 * Get scaled CSS value with custom scale
 */
export function scaleCustom(value: number, scaleOverride?: number): string {
  if (scaleOverride !== undefined) {
    return `${value * scaleOverride}px`;
  }
  return scale(value);
}
