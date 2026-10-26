import { useWindowDimensions } from 'react-native';

// Palette e misure di Bootstrap 5, così web e telefono hanno lo stesso aspetto.
export const colors = {
  primary: '#0d6efd',
  secondary: '#6c757d',
  success: '#198754',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#0dcaf0',
  light: '#f8f9fa',
  dark: '#212529',
  white: '#ffffff',
  body: '#212529',
  bodyBg: '#f8f9fa',
  border: '#dee2e6',
  borderCard: 'rgba(0,0,0,0.175)',
  muted: '#6c757d',
  focus: '#86b7fe',
  focusRing: 'rgba(13,110,253,0.25)',
};

export type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';

// colore del testo sopra lo sfondo pieno di ogni variante
export const onVariant: Record<Variant, string> = {
  primary: '#fff',
  secondary: '#fff',
  success: '#fff',
  danger: '#fff',
  warning: '#000',
  info: '#000',
  light: '#000',
  dark: '#fff',
};

// colori degli "alert" (sfondo chiaro, bordo, testo)
export const alertColors = {
  danger: { bg: '#f8d7da', border: '#f1aeb5', text: '#58151c' },
  success: { bg: '#d1e7dd', border: '#a3cfbb', text: '#0a3622' },
  info: { bg: '#cff4fc', border: '#9eeaf9', text: '#055160' },
};

export const radius = { sm: 4, md: 6, lg: 8, pill: 50 };

// scala delle spaziature di Bootstrap: 0, .25rem, .5rem, 1rem, 1.5rem, 3rem
export const space = [0, 4, 8, 16, 24, 48] as const;

export const breakpoints = { sm: 576, md: 768, lg: 992, xl: 1200 };
export const containerMax = { sm: 540, md: 720, lg: 960, xl: 1140 };

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
const ORDER: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];

export function breakpointFor(width: number): Breakpoint {
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
}

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const bp = breakpointFor(width);
  return { width, bp, atLeast: (min: Breakpoint) => ORDER.indexOf(bp) >= ORDER.indexOf(min) };
}

export const ORDERED_BREAKPOINTS = ORDER;
