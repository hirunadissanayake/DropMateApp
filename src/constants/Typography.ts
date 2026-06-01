import { Platform } from 'react-native';

export const Typography = {
  regular:   Platform.OS === 'ios' ? 'Inter24pt-Regular'   : 'Inter-Regular',
  medium:    Platform.OS === 'ios' ? 'Inter24pt-Medium'    : 'Inter-Medium',
  semiBold:  Platform.OS === 'ios' ? 'Inter24pt-SemiBold'  : 'Inter-SemiBold',
  bold:      Platform.OS === 'ios' ? 'Inter24pt-Bold'      : 'Inter-Bold',
  extraBold: Platform.OS === 'ios' ? 'Inter24pt-ExtraBold' : 'Inter-ExtraBold',
};
