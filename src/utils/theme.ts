// Theme System for Energy Ledger
// 功过格 - 视觉风格：流体与呼吸

export const colors = {
  // 背景色
  background: {
    primary: '#0a0f1e',
    secondary: '#0d1b3e',
    gradient: ['#0d1b3e', '#0a1628', '#0f0d2e'],
  },
  
  // 聚能色 - 青色/金色
  flow: {
    primary: '#00d4d4',
    secondary: '#00b4b4',
    light: 'rgba(0, 212, 212, 0.15)',
    glow: 'rgba(0, 220, 200, 0.3)',
  },
  
  // 耗散色 - 柔和紫/浊橙
  drain: {
    primary: '#a060e0',
    secondary: '#8040c0',
    light: 'rgba(160, 80, 220, 0.15)',
    glow: 'rgba(160, 80, 220, 0.3)',
  },
  
  // 转念色 - 金色
  transform: {
    primary: '#ffb400',
    secondary: '#ff9500',
    light: 'rgba(255, 180, 0, 0.15)',
    glow: 'rgba(255, 200, 0, 0.3)',
  },
  
  // 通用色
  white: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    muted: 'rgba(255, 255, 255, 0.35)',
    subtle: 'rgba(255, 255, 255, 0.15)',
    border: 'rgba(255, 255, 255, 0.08)',
  },
  
  // 状态色
  success: 'rgba(0, 180, 100, 0.8)',
  warning: 'rgba(255, 180, 0, 0.9)',
  danger: 'rgba(220, 60, 60, 0.8)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const typography = {
  fontSize: {
    xs: 10,
    sm: 11,
    md: 12,
    lg: 13,
    xl: 14,
    '2xl': 15,
    '3xl': 16,
    '4xl': 18,
    '5xl': 20,
    '6xl': 22,
    '7xl': 26,
    '8xl': 28,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

// 渐变样式
export const gradients = {
  background: {
    colors: ['#0d1b3e', '#0a1628', '#0f0d2e'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  flow: {
    colors: ['rgba(0, 180, 180, 0.9)', 'rgba(0, 140, 160, 0.9)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  drain: {
    colors: ['rgba(160, 80, 220, 0.9)', 'rgba(120, 40, 180, 0.9)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  success: {
    colors: ['rgba(0, 180, 100, 0.8)', 'rgba(0, 140, 80, 0.7)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

// 阴影样式
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string, opacity: number = 0.3) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: opacity,
    shadowRadius: 20,
    elevation: 10,
  }),
};

// 动画时长
export const animation = {
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
    verySlow: 500,
  },
};