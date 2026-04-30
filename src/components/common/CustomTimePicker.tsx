import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { Typography } from '../../constants/Typography';
import { useTheme } from '../../context/ThemeContext';
import { AppTheme } from '../../constants/Colors';

// ─── Constants ────────────────────────────────────────────────────────────────
const ITEM_H      = 54;          // height of each row in the drum
const VISIBLE     = 5;           // rows visible at once
const DRUM_H      = ITEM_H * VISIBLE;

interface CustomTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (time: string) => void;
  selectedTime?: string;
  theme?: AppTheme;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const ClockIcon = ({ theme }: { theme: AppTheme }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={theme.primary} strokeWidth="2" />
    <Path
      d="M12 7v5l3 3"
      stroke={theme.primary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── Parse "HH:MM AM/PM" → { hour, minute, ampm } ───────────────────────────
const parse = (t?: string) => {
  if (!t) return { hour: '10', minute: '00', ampm: 'AM' as const };
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return { hour: '10', minute: '00', ampm: 'AM' as const };
  return {
    hour:   m[1].padStart(2, '0'),
    minute: m[2].padStart(2, '0'),
    ampm:   m[3].toUpperCase() as 'AM' | 'PM',
  };
};

// ─── Drum Wheel ───────────────────────────────────────────────────────────────
interface DrumProps {
  data: string[];
  selected: string;
  onSelect: (v: string) => void;
  pickerVisible: boolean;
  theme: AppTheme;
}

const Drum: React.FC<DrumProps> = ({ data, selected, onSelect, pickerVisible, theme }) => {
  const ref        = useRef<ScrollView>(null);
  const dragging   = useRef(false);
  const selIndex   = data.indexOf(selected);
  const styles     = drumStyles(theme);

  // Scroll to the selected item ONLY when the picker opens
  useEffect(() => {
    if (!pickerVisible) return;
    const idx = data.indexOf(selected);
    const t = setTimeout(() => {
      if (!dragging.current) {
        ref.current?.scrollTo({ y: idx * ITEM_H, animated: false });
      }
    }, 60);
    return () => clearTimeout(t);
  }, [pickerVisible]);

  const resolve = (offsetY: number) => {
    const i = Math.round(offsetY / ITEM_H);
    return data[Math.max(0, Math.min(i, data.length - 1))];
  };

  return (
    <View style={styles.wrap}>
      {/* Selector highlight rail */}
      <View style={styles.selectorRail} pointerEvents="none" />

      <ScrollView
        ref={ref}
        style={styles.scroll}
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        snapToAlignment="center"
        onScrollBeginDrag={() => { dragging.current = true; }}
        onScrollEndDrag={e => {
          onSelect(resolve(e.nativeEvent.contentOffset.y));
        }}
        onMomentumScrollEnd={e => {
          onSelect(resolve(e.nativeEvent.contentOffset.y));
          setTimeout(() => { dragging.current = false; }, 200);
        }}
      >
        {data.map((item, idx) => {
          const dist   = Math.abs(idx - selIndex);
          const center = dist === 0;
          const edge   = dist === 1;
          return (
            <TouchableOpacity
              key={item}
              style={styles.item}
              activeOpacity={0.6}
              onPress={() => {
                onSelect(item);
                ref.current?.scrollTo({ y: idx * ITEM_H, animated: true });
              }}
            >
              <Text style={[
                styles.label,
                edge   && styles.labelEdge,
                center && styles.labelCenter,
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Fade masks */}
      <LinearGradient colors={[theme.card, 'transparent']} style={styles.fadeTop}    pointerEvents="none" />
      <LinearGradient colors={['transparent', theme.card]} style={styles.fadeBottom} pointerEvents="none" />
    </View>
  );
};

const drumStyles = (theme: AppTheme) => StyleSheet.create({
  wrap: {
    flex: 1,
    height: DRUM_H,
    overflow: 'hidden',
    position: 'relative',
  },
  selectorRail: {
    position: 'absolute',
    top: ITEM_H * 2 - 2,
    alignSelf: 'center',
    width: '100%',
    height: ITEM_H + 4,
    backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.1)' : '#DCFBEB',
    borderRadius: 12,
    zIndex: 0,
    borderWidth: 1.5,
    borderColor: theme.isDark ? 'rgba(16, 185, 129, 0.2)' : '#A7F3D0',
  },
  scroll: { flex: 1, zIndex: 1 },
  item: {
    height: ITEM_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 20,
    color: theme.text.tertiary,
    fontFamily: Typography.medium,
  },
  labelEdge: {
    fontSize: 22,
    color: theme.text.secondary,
    fontFamily: Typography.semiBold,
  },
  labelCenter: {
    fontSize: 28,
    color: theme.primary,
    fontFamily: Typography.extraBold,
  },
  fadeTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: ITEM_H * 1.5,
    zIndex: 5,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: ITEM_H * 1.5,
    zIndex: 5,
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────
const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  visible,
  onClose,
  onSelectTime,
  selectedTime,
  theme: providedTheme,
}) => {
  const { theme: contextTheme } = useTheme();
  const theme = providedTheme || contextTheme;
  const s = makeStyles(theme);

  const parsed  = parse(selectedTime);
  const [hour,   setHour]   = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [ampm,   setAmpm]   = useState<'AM' | 'PM'>(parsed.ampm);

  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const slideAnim    = useRef(new Animated.Value(300)).current;
  const confirmScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      const p = parse(selectedTime);
      setHour(p.hour);
      setMinute(p.minute);
      setAmpm(p.ampm);
    }
  }, [visible, selectedTime]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 45, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const hours   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const previewLabel = `${hour}:${minute} ${ampm}`;

  const handleConfirmPress = () => {
    Animated.sequence([
      Animated.timing(confirmScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(confirmScale, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start(() => {
      onSelectTime(previewLabel);
      onClose();
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={s.overlay}>
        <Animated.View style={[s.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={s.handle} />

          <View style={s.header}>
            <View style={s.headerIconBadge}>
              <ClockIcon theme={theme} />
            </View>
            <View style={s.headerText}>
              <Text style={s.title}>Set Travel Time</Text>
              <Text style={s.subtitle}>Choose hour, minute & period</Text>
            </View>
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={s.previewBadge}>
              <Text style={s.previewText}>{previewLabel}</Text>
            </LinearGradient>
          </View>

          <LinearGradient
            colors={[theme.primary, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.accentLine}
          />

          <View style={s.drumsRow}>
            <View style={s.drumCol}>
              <Text style={s.drumLabel}>HOUR</Text>
              <Drum data={hours}   selected={hour}   onSelect={setHour}   pickerVisible={visible} theme={theme} />
            </View>

            <View style={s.colonCol}>
              <Text style={s.colon}>:</Text>
            </View>

            <View style={s.drumCol}>
              <Text style={s.drumLabel}>MIN</Text>
              <Drum data={minutes} selected={minute} onSelect={setMinute} pickerVisible={visible} theme={theme} />
            </View>

            <View style={s.sep} />

            <View style={s.periodCol}>
              <Text style={s.drumLabel}>PERIOD</Text>
              <View style={s.periodWrap}>
                <TouchableOpacity
                  style={[s.periodBtn, ampm === 'AM' && s.periodActive]}
                  onPress={() => setAmpm('AM')}
                  activeOpacity={0.75}
                >
                  <Text style={[s.periodText, ampm === 'AM' && s.periodActiveText]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.periodBtn, ampm === 'PM' && s.periodActive]}
                  onPress={() => setAmpm('PM')}
                  activeOpacity={0.75}
                >
                  <Text style={[s.periodText, ampm === 'PM' && s.periodActiveText]}>PM</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={s.footer}>
             <TouchableOpacity style={s.btnCancel} onPress={onClose} activeOpacity={0.7}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path d="M19 12H5M12 19l-7-7 7-7" stroke={theme.text.secondary} strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={s.btnCancelText}>Back</Text>
              </TouchableOpacity>
            
            <Animated.View style={[s.btnConfirm, { transform: [{ scale: confirmScale }] }]}>
              <TouchableOpacity style={{ flex: 1 }} onPress={handleConfirmPress} activeOpacity={0.85}>
                <LinearGradient
                  colors={[theme.primary, theme.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.btnGradient}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                  <Text style={s.btnConfirmText}>Save Time</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 30,
  },
  handle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: theme.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  headerIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.1)' : '#DCFBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    color: theme.text.primary,
    fontFamily: Typography.bold,
  },
  subtitle: {
    fontSize: 12,
    color: theme.text.tertiary,
    fontFamily: Typography.medium,
    marginTop: 2,
  },
  previewBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  previewText: {
    color: '#fff',
    fontFamily: Typography.bold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  accentLine: {
    height: 2,
    borderRadius: 2,
    marginBottom: 10,
  },
  drumsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    height: DRUM_H + 32,
  },
  drumCol: { flex: 1, alignItems: 'center', height: '100%'},
  drumLabel: {
    fontSize: 10, 
    color: theme.text.tertiary, letterSpacing: 1.5,
    marginBottom: 12, fontFamily: Typography.bold,
  },
  colonCol: {
    paddingTop: 32,
    alignItems: 'center',
  },
  colon: {
    fontSize: 30, color: theme.text.tertiary,
    fontWeight: '300', marginHorizontal: 2,
  },
  sep: {
    width: 1,
    height: '60%',
    backgroundColor: theme.border,
    marginTop: 28, marginHorizontal: 6,
  },
  periodCol: { width: 100, alignItems: 'center', height: '100%' },
  periodWrap: {
    flexDirection: 'row',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
    borderRadius: 18,
    padding: 4,
    width: '100%',
    borderWidth: 1.5,
    borderColor: theme.border,
    position: 'relative',
    height: 52,
    alignItems: 'center',
    marginTop: 8,
  },
  periodBtn: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    zIndex: 1,
  },
  periodActive: {
    backgroundColor: theme.isDark ? theme.background : '#fff',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFBEB',
  },
  periodText: {
    fontSize: 14, color: theme.text.tertiary,
    fontFamily: Typography.bold,
  },
  periodActiveText: {
    color: theme.primary, fontSize: 15, 
    fontFamily: Typography.bold,
  },
  footer: { flexDirection: 'row', gap: 12, marginTop: 4 },
  btnCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  btnCancelText: {
    fontSize: 15, 
    color: theme.text.secondary, fontFamily: Typography.bold,
  },
  btnConfirm: { flex: 1, height: 56, borderRadius: 18, overflow: 'hidden' },
  btnGradient: { 
    flex: 1, justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row', gap: 8 
  },
  btnConfirmText: {
    fontSize: 16, 
    color: '#fff', fontFamily: Typography.bold,
  },
});

export default CustomTimePicker;
