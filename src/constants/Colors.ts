export interface AppTheme {
  isDark: boolean;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  background: string;
  bgGradient: string[];
  surfaceLight: string;
  surface: string;
  card: string;
  white: string;
  border: string;
  inputBg: string;
  toggleBg: string;
  shadowColor: string;
  statusBar: 'dark-content' | 'light-content';
  text: {
    brand: string;
    primary: string;
    secondary: string;
    tertiary: string;
    placeholder: string;
    inverse: string;
  };
  trustCard: string;
  strengthBar: string;
}

export const lightTheme: AppTheme = {
  isDark: false,
  primary: '#006C52',
  primaryDark: '#004A38',
  primaryLight: '#7DF2C8',
  background: '#F7FCF9',
  bgGradient: ['#E7FFF2', '#FFFFFF'],
  surfaceLight: '#FFFFFF',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  white: '#FFFFFF',
  border: 'rgba(190, 201, 194, 0.2)',
  inputBg: 'rgba(220, 251, 235, 0.2)',
  toggleBg: 'rgba(0, 108, 82, 0.08)',
  shadowColor: '#052017',
  statusBar: 'dark-content',
  text: {
    brand: '#00513D',
    primary: '#052017',
    secondary: '#3F4944',
    tertiary: '#6F7A74',
    placeholder: 'rgba(111, 122, 116, 0.5)',
    inverse: '#FFFFFF',
  },
  trustCard: '#D7F5E5',
  strengthBar: '#CBE9DA',
};

export const darkTheme: AppTheme = {
  isDark: true,
  primary: '#3DD9A4',
  primaryDark: '#2CB88A',
  primaryLight: '#1A1A1A',
  background: '#000000',
  bgGradient: ['#000000', '#0A0A0A'],
  surfaceLight: '#121212',
  surface: '#121212',
  card: '#121212',
  white: '#FFFFFF',
  border: 'rgba(255, 255, 255, 0.12)',
  inputBg: 'rgba(255, 255, 255, 0.05)',
  toggleBg: 'rgba(61, 217, 164, 0.15)',
  shadowColor: '#000000',
  statusBar: 'light-content',
  text: {
    brand: '#3DD9A4',
    primary: '#F8FAF9',
    secondary: '#A1A1A1',
    tertiary: '#717171',
    placeholder: 'rgba(161, 161, 161, 0.4)',
    inverse: '#000000',
  },
  trustCard: '#181818',
  strengthBar: '#333333',
};

// Backward-compatible alias — existing screens that import `Colors` keep working
export const Colors = lightTheme;
