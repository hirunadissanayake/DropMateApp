import { Platform } from 'react-native';

export const Typography = {
  regular: Platform.OS === 'ios' ? 'Inter-Regular' : 'Inter-Regular',
  medium: Platform.OS === 'ios' ? 'Inter-Medium' : 'Inter-Medium',
  semiBold: Platform.OS === 'ios' ? 'Inter-SemiBold' : 'Inter-SemiBold',
  bold: Platform.OS === 'ios' ? 'Inter-Bold' : 'Inter-Bold',
  extraBold: Platform.OS === 'ios' ? 'Inter-ExtraBold' : 'Inter-ExtraBold',
};
