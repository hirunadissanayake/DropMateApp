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
  TextInput,
  ActivityIndicator,
} from 'react-native';

import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';
import { Typography } from '../../constants/Typography';
import { AppTheme } from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';

interface CustomDropdownProps {
  label?: string;
  options: string[];
  selectedOption: string;
  onSelect: (option: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  theme?: AppTheme;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  options,
  selectedOption,
  onSelect,
  placeholder = 'Select an option',
  disabled = false,
  isLoading = false,
  theme: propTheme,
}) => {
  const { theme: contextTheme } = useTheme();
  const theme = propTheme || contextTheme;
  const s = makeStyles(theme);

  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (option: string) => {
    onSelect(option);
    setIsVisible(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    setIsVisible(false);
    setSearchQuery('');
  };

  const renderOptionIcon = (option: string, active: boolean) => {
    const color = active ? theme.primary : theme.text.tertiary;
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
          <View style={[s.routeDotStart, !active && { backgroundColor: theme.isDark ? '#1E293B' : '#F8FAFC', borderColor: theme.border }]}>
            <View style={[s.routeDotInner, !active && { backgroundColor: theme.text.tertiary }]} />
          </View>
        );
    }
  };

  return (
    <View style={s.container}>
      {label && (
        <Text style={s.label}>
          {label.split('*').map((part, index, array) => (
            <React.Fragment key={index}>
              {part}
              {index < array.length - 1 && <Text style={{ color: '#EF4444' }}>*</Text>}
            </React.Fragment>
          ))}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          s.selectBox, 
          isVisible && s.selectedBoxActive,
          (disabled || isLoading) && s.selectBoxDisabled
        ]}
        onPress={() => !disabled && !isLoading && setIsVisible(true)}
        activeOpacity={(disabled || isLoading) ? 1 : 0.7}
      >
        {isLoading ? (
          <View style={s.loadingContainer}>
            <View style={s.skeletonIcon} />
            <View style={s.skeletonText} />
          </View>
        ) : (
          <>
            <View style={s.selectedContent}>
              {renderOptionIcon(selectedOption, true)}
              <Text 
                style={[s.selectText, !selectedOption && s.placeholderText]} 
                numberOfLines={1} 
                ellipsizeMode="tail"
              >
                {selectedOption || placeholder}
              </Text>
            </View>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <Path
                d={isVisible ? "M18 15L12 9L6 15" : "M6 9L12 15L18 9"}
                stroke={isVisible ? theme.primary : theme.text.tertiary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </>
        )}
      </TouchableOpacity>


      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              <View style={s.dragHandle} />
              
              <View style={s.modalHeader}>
                <View>
                  <Text style={s.modalTitle}>{label || 'Select Option'}</Text>
                  <Text style={s.modalSubtitle}>Please choose one from the list below</Text>
                </View>
                <TouchableOpacity 
                  onPress={handleClose}
                  style={s.closeBtn}
                >
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <Path d="M18 6L6 18M6 6L18 18" stroke={theme.text.tertiary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </Svg>
                </TouchableOpacity>
              </View>

              <View style={s.searchContainer}>
                <View style={s.searchBox}>
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <Circle cx="11" cy="11" r="8" />
                    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </Svg>
                  <TextInput
                    style={s.searchInput}
                    placeholder="Search options..."
                    placeholderTextColor={theme.text.placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M18 6L6 18M6 6L18 18" />
                      </Svg>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              <FlatList
                data={filteredOptions}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      s.optionItem,
                      selectedOption === item && s.optionItemActive
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={s.optionContentLeft}>
                      <View style={[
                        s.iconContainer,
                        selectedOption === item && s.iconContainerActive
                      ]}>
                        {renderOptionIcon(item, selectedOption === item)}
                      </View>
                      <Text style={[
                        s.optionText,
                        selectedOption === item && s.optionTextActive
                      ]}>
                        {item}
                      </Text>
                    </View>
                    {selectedOption === item && (
                      <View style={s.checkCircle}>
                        <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <Path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </Svg>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={s.listContent}
                ListEmptyComponent={
                  <View style={s.emptyContainer}>
                    <Text style={s.emptyText}>No matches found for "{searchQuery}"</Text>
                  </View>
                }
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 11,
    color: theme.text.secondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    paddingLeft: 4,
    fontFamily: Typography.bold,
  },
  selectBox: {
    height: 60,
    backgroundColor: theme.background,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  selectBoxDisabled: {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
    opacity: 0.6,
    borderColor: theme.border,
  },
  selectedBoxActive: {
    borderColor: theme.primary,
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  selectText: {
    fontSize: 16,
    color: theme.text.primary,
    fontFamily: Typography.semiBold,
    flex: 1,
  },
  placeholderText: {
    color: theme.text.placeholder,
    fontFamily: Typography.medium,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(5, 32, 23, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
    borderTopWidth: theme.isDark ? 1 : 0,
    borderLeftWidth: theme.isDark ? 1 : 0,
    borderRightWidth: theme.isDark ? 1 : 0,
    borderColor: theme.border,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: theme.border,
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
    color: theme.text.primary,
    fontFamily: Typography.extraBold,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 13,
    color: theme.text.secondary,
    fontFamily: Typography.regular,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
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
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  optionItemActive: {
    borderColor: theme.primary,
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
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
  },
  optionText: {
    fontSize: 16,
    color: theme.text.secondary,
    fontFamily: Typography.semiBold,
  },
  optionTextActive: {
    color: theme.text.primary,
    fontFamily: Typography.bold,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  routeDotStart: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.1)' : '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.primary,
  },
  routeDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.primary,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  searchBox: {
    height: 48,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: theme.text.primary,
    fontFamily: Typography.medium,
    padding: 0,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.text.placeholder,
    fontFamily: Typography.medium,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
  },
  skeletonText: {
    height: 14,
    width: '50%',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
    borderRadius: 4,
  },
});


export default CustomDropdown;
