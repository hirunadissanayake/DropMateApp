import React from 'react';
import { TouchableOpacity, StyleSheet, View, Platform, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

interface BackButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  color?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ onPress, style, color = '#064E3B' }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, style]}
      activeOpacity={0.7}
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
    >
      <View style={styles.iconWrapper}>
        <Svg width="20" height="20" viewBox="0 0 16 16" fill="none">
          <Path
            d="M3.63375 8.55L8.95375 13.87L7.6 15.2L0 7.6L7.6 0L8.95375 1.33L3.63375 6.65H15.2V8.55H3.63375Z"
            fill={color}
          />
        </Svg>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BackButton;
