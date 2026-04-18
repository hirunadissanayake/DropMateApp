import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

interface CustomDropdownProps {
  label?: string;
  options: string[];
  selectedOption: string;
  onSelect: (option: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  options,
  selectedOption,
  onSelect,
  placeholder = 'Select an option',
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleSelect = (option: string) => {
    onSelect(option);
    setIsVisible(false);
  };

  const renderOptionIcon = (option: string, active: boolean) => {
    const color = active ? Colors.primary : '#64748B';
    const size = 20;

    switch (option.toLowerCase()) {
      case 'bus':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M19 5H5C3.34315 5 2 6.34315 2 8V17C2 18.6569 3.34315 20 5 20H19C20.6569 20 22 18.6569 22 17V8C22 6.34315 20.6569 5 19 5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <Path d="M16 9V13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <Path d="M8 9V13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <Path d="M2 15H22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <Path d="M6 20V22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <Path d="M18 20V22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
        );
      case 'car':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M19 17H5C3.89543 17 3 16.1046 3 15V9.43147C3 8.71836 3.37617 8.05831 3.99222 7.69805L5.80735 6.62141C6.54924 6.18525 7.42065 5.97576 8.30397 6.01899L15.696 6.38075C16.5794 6.42399 17.4508 6.63348 18.1927 7.06964L20.0078 8.14628C20.6238 8.50654 21 9.1666 21 9.87971V15C21 16.1046 20.1046 17 19 17Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <Circle cx="7" cy="17" r="2" stroke={color} strokeWidth="2"/>
            <Circle cx="17" cy="17" r="2" stroke={color} strokeWidth="2"/>
            <Path d="M14 9H10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
        );
      case 'motor bike':
      case 'motorbike':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle cx="5" cy="18" r="3" stroke={color} strokeWidth="2"/>
            <Circle cx="19" cy="18" r="3" stroke={color} strokeWidth="2"/>
            <Path d="M12 18V12L15 8H19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <Path d="M8 18V13C8 13 8 10 11 10H14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
        );
      case 'train':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
             <Path d="M7 15H17M7 11H17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             <Rect x="5" y="5" width="14" height="12" rx="2" ry="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             <Path d="M8 21L10 17M16 21L14 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
        );
      default:
        return (
          <View style={[styles.routeDotStart, !active && { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }]}>
            <View style={[styles.routeDotInner, !active && { backgroundColor: '#94A3B8' }]} />
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.selectBox, 
          isVisible && styles.selectedBoxActive,
          disabled && styles.selectBoxDisabled
        ]}
        onPress={() => !disabled && setIsVisible(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <View style={styles.selectedContent}>
          {renderOptionIcon(selectedOption, true)}
          <Text style={[styles.selectText, !selectedOption && styles.placeholderText]}>
            {selectedOption || placeholder}
          </Text>
        </View>
        <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <Path
            d={isVisible ? "M18 15L12 9L6 15" : "M6 9L12 15L18 9"}
            stroke={isVisible ? Colors.primary : "#64748B"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.dragHandle} />
              
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{label || 'Select Option'}</Text>
                  <Text style={styles.modalSubtitle}>Please choose one from the list below</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setIsVisible(false)}
                  style={styles.closeBtn}
                >
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <Path d="M18 6L6 18M6 6L18 18" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </Svg>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={options}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      selectedOption === item && styles.optionItemActive
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={styles.optionContentLeft}>
                      <View style={[
                        styles.iconContainer,
                        selectedOption === item && styles.iconContainerActive
                      ]}>
                        {renderOptionIcon(item, selectedOption === item)}
                      </View>
                      <Text style={[
                        styles.optionText,
                        selectedOption === item && styles.optionTextActive
                      ]}>
                        {item}
                      </Text>
                    </View>
                    {selectedOption === item && (
                      <View style={styles.checkCircle}>
                        <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <Path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </Svg>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.text.secondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    paddingLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  selectBox: {
    height: 60,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  selectBoxDisabled: {
    backgroundColor: '#F1F5F9',
    opacity: 0.6,
    borderColor: '#E2E8F0',
  },
  selectedBoxActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectText: {
    fontSize: 16,
    color: '#052017',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  placeholderText: {
    color: '#94A3B8',
    fontWeight: '500',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 32, 23, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-ExtraBold',
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Manrope',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 18,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  optionItemActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  optionContentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(0, 108, 82, 0.08)',
  },
  optionText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-SemiBold',
  },
  optionTextActive: {
    color: '#052017',
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  routeDotStart: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  routeDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
});

export default CustomDropdown;
