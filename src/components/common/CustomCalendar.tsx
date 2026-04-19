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

const { height } = Dimensions.get('window');

const GREEN       = '#006C52';
const GREEN_DARK  = '#004D3A';
const GREEN_LIGHT = '#DCFBEB';

interface CustomCalendarProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  selectedDate?: string;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({
  visible,
  onClose,
  onSelectDate,
  selectedDate,
}) => {
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
          selectedColor: GREEN,
          selectedTextColor: '#fff',
        },
      }
    : {};

  const handleDayPress = (day: DateData) => {
    onSelectDate(day.dateString);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={s.overlay}>
        {/* Backdrop */}
        <Animated.View style={[s.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Select Date</Text>
            <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={s.divider} />

          {/* Calendar */}
          <Calendar
            current={selectedDate || today}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            minDate={today}
            enableSwipeMonths
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',

              // Month/year header
              monthTextColor: '#0F172A',
              textMonthFontFamily: Typography.bold,
              textMonthFontSize: 17,

              // Arrow buttons
              arrowColor: GREEN,

              // Day-of-week labels
              textSectionTitleColor: '#94A3B8',
              textDayHeaderFontFamily: Typography.bold,
              textDayHeaderFontSize: 12,

              // Day numbers
              dayTextColor: '#0F172A',
              textDayFontFamily: Typography.medium,
              textDayFontSize: 15,

              // Today
              todayTextColor: GREEN,
              todayBackgroundColor: GREEN_LIGHT,

              // Selected
              selectedDayBackgroundColor: GREEN,
              selectedDayTextColor: '#ffffff',

              // Disabled
              textDisabledColor: '#CBD5E1',

              // Dot
              dotColor: GREEN,
              selectedDotColor: '#ffffff',
            }}
            style={s.calendar}
          />

          <View style={s.divider} />

          {/* Footer */}
          <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={s.cancelText}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
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
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 4,
  },
  calendar: {
    borderRadius: 16,
    marginVertical: 8,
  },
  cancelBtn: {
    marginTop: 16,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cancelText: {
    fontSize: 15,
    color: '#64748B',
    fontFamily: Typography.bold,
  },
});

export default CustomCalendar;
