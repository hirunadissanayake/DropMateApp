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
  primaryLight: '#1A3D30',
  background: '#0D1F18',
  bgGradient: ['#0D1F18', '#132B22'],
  surfaceLight: '#1A2E24',
  surface: '#1A2E24',
  card: '#1E3328',
  white: '#FFFFFF',
  border: 'rgba(61, 217, 164, 0.12)',
  inputBg: 'rgba(61, 217, 164, 0.06)',
  toggleBg: 'rgba(61, 217, 164, 0.12)',
  shadowColor: '#000000',
  statusBar: 'light-content',
  text: {
    brand: '#3DD9A4',
    primary: '#EAF5F0',
    secondary: '#A8C4B8',
    tertiary: '#6E9585',
    placeholder: 'rgba(168, 196, 184, 0.4)',
    inverse: '#0D1F18',
  },
  trustCard: '#1E3328',
  strengthBar: '#1E3328',
};

// Backward-compatible alias — existing screens that import `Colors` keep working
export const Colors = lightTheme;
