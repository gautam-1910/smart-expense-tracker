export const lightColors = {
  background: '#F4F7F5',
  surface: '#FFFFFF',
  primary: '#1B7F4B',
  primaryText: '#FFFFFF',
  text: '#14211A',
  textSecondary: '#5C6B62',
  border: '#E2E8E4',
  success: '#1B7F4B',
  danger: '#C62828',
  food: '#E67E22',
  transport: '#2980B9',
  shopping: '#8E44AD',
  bills: '#D4A017',
  health: '#16A085',
  entertainment: '#C0392B',
  others: '#7F8C8D',
} as const;

export const darkColors = {
  background: '#0E1110',
  surface: '#1A1F1C',
  primary: '#2E9B5E',
  primaryText: '#FFFFFF',
  text: '#F2F5F3',
  textSecondary: '#9AA89F',
  border: '#2A332E',
  success: '#3DCC7A',
  danger: '#EF5350',
  food: '#F39C3A',
  transport: '#4AA3D9',
  shopping: '#B06BD4',
  bills: '#E8C047',
  health: '#2EC4A8',
  entertainment: '#E0574A',
  others: '#A0A8A7',
} as const;

export type Theme = { [K in keyof typeof lightColors]: string };
