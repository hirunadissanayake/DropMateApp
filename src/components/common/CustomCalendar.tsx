import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Typography } from '../../constants/Typography';
import { useTheme } from '../../context/ThemeContext';
import { AppTheme } from '../../constants/Colors';

const { height } = Dimensions.get('window');

interface CustomCalendarProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  selectedDate?: string;
  theme?: AppTheme;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({
  visible,
  onClose,
  onSelectDate,
  selectedDate,
  theme: providedTheme,
}) => {
  const { theme: contextTheme } = useTheme();
  const theme = providedTheme || contextTheme;
  const styles = makeStyles(theme);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 50, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const today = new Date().toISOString().split('T')[0];

  const markedDates = selectedDate
    ? {
        [selectedDate]: {
          selected: true,
          selectedColor: theme.primary,
          selectedTextColor: '#ffffff',
        },
      }
    : {};

  const handleDayPress = (day: DateData) => {
    onSelectDate(day.dateString);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Date</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Calendar */}
          <Calendar
            current={selectedDate || today}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            minDate={today}
            enableSwipeMonths
            monthFormat={'MMMM yyyy'}
            theme={{
              backgroundColor: theme.card,
              calendarBackground: theme.card,

              // Month/year header
              monthTextColor: theme.text.primary,
              textMonthFontFamily: Typography.bold,
              textMonthFontSize: 17,

              // Arrow buttons
              arrowColor: theme.primary,

              // Day-of-week labels
              textSectionTitleColor: theme.text.tertiary,
              textDayHeaderFontFamily: Typography.bold,
              textDayHeaderFontSize: 12,

              // Day numbers
              dayTextColor: theme.text.primary,
              textDayFontFamily: Typography.medium,
              textDayFontSize: 15,

              // Today
              todayTextColor: theme.primary,
              todayBackgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.1)' : '#DCFBEB',

              // Selected
              selectedDayBackgroundColor: theme.primary,
              selectedDayTextColor: '#ffffff',

              // Disabled
              textDisabledColor: theme.border,

              // Dot
              dotColor: theme.primary,
              selectedDotColor: '#ffffff',
            }}
            style={styles.calendar}
          />

          <View style={styles.divider} />

          {/* Footer */}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 18,
    color: theme.text.primary,
    fontFamily: Typography.bold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: theme.text.secondary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginBottom: 4,
  },
  calendar: {
    borderRadius: 16,
    marginVertical: 8,
  },
  cancelBtn: {
    marginTop: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cancelText: {
    fontSize: 15,
    color: theme.text.secondary,
    fontFamily: Typography.bold,
  },
});

export default CustomCalendar;
