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

// ─── Constants ────────────────────────────────────────────────────────────────
const BRAND_GREEN = '#006C52';
const BRAND_MID   = '#008A68';
const BRAND_LIGHT = '#DCFBEB';
const ITEM_H      = 54;          // height of each row in the drum
const VISIBLE     = 5;           // rows visible at once
const DRUM_H      = ITEM_H * VISIBLE;

interface CustomTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (time: string) => void;
  selectedTime?: string;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const ClockIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={BRAND_GREEN} strokeWidth="2" />
    <Path
      d="M12 7v5l3 3"
      stroke={BRAND_GREEN}
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
}

const Drum: React.FC<DrumProps> = ({ data, selected, onSelect, pickerVisible }) => {
  const ref        = useRef<ScrollView>(null);
  const dragging   = useRef(false);
  const selIndex   = data.indexOf(selected);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerVisible]);

  const resolve = (offsetY: number) => {
    const i = Math.round(offsetY / ITEM_H);
    return data[Math.max(0, Math.min(i, data.length - 1))];
  };

  return (
    <View style={drum.wrap}>
      {/* Selector highlight rail */}
      <View style={drum.selectorRail} pointerEvents="none" />

      <ScrollView
        ref={ref}
        style={drum.scroll}
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
              style={drum.item}
              activeOpacity={0.6}
              onPress={() => {
                onSelect(item);
                ref.current?.scrollTo({ y: idx * ITEM_H, animated: true });
              }}
            >
              <Text style={[
                drum.label,
                edge   && drum.labelEdge,
                center && drum.labelCenter,
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Fade masks */}
      <LinearGradient colors={['#fff', 'rgba(255,255,255,0)']} style={drum.fadeTop}    pointerEvents="none" />
      <LinearGradient colors={['rgba(255,255,255,0)', '#fff']} style={drum.fadeBottom} pointerEvents="none" />
    </View>
  );
};

const drum = StyleSheet.create({
  wrap: {
    flex: 1,
    height: DRUM_H,
    overflow: 'hidden',
    position: 'relative',
  },
  selectorRail: {
    position: 'absolute',
    top: ITEM_H * 2,
    alignSelf: 'center',
    width: ITEM_H + 4,
    height: ITEM_H + 4,
    backgroundColor: BRAND_LIGHT,
    borderRadius: (ITEM_H + 4) / 2, // Perfect circle shape
    zIndex: 0,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  scroll: { flex: 1, zIndex: 1 },
  item: {
    height: ITEM_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 20,
    color: '#CBD5E1',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Medium',
  },
  labelEdge: {
    fontSize: 21,
    color: '#94A3B8',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Medium',
  },
  labelCenter: {
    fontSize: 26,
    color: BRAND_GREEN,
    fontWeight: '800',
    fontFamily: 'Manrope-Bold',
  },
  fadeTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: ITEM_H * 2,
    zIndex: 5,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: ITEM_H * 2,
    zIndex: 5,
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────
const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  visible,
  onClose,
  onSelectTime,
  selectedTime,
}) => {
  const parsed  = parse(selectedTime);
  const [hour,   setHour]   = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [ampm,   setAmpm]   = useState<'AM' | 'PM'>(parsed.ampm);

  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const slideAnim    = useRef(new Animated.Value(300)).current;
  const confirmScale = useRef(new Animated.Value(1)).current;

  // Re-parse on open
  useEffect(() => {
    if (visible) {
      const p = parse(selectedTime);
      setHour(p.hour);
      setMinute(p.minute);
      setAmpm(p.ampm);
    }
  }, [visible, selectedTime]);

  // Sheet animation
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

        {/* Backdrop */}
        <Animated.View style={[s.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>

          <View style={s.handle} />

          {/* ── Header ── */}
          <View style={s.header}>
            <View style={s.headerIconBadge}>
              <ClockIcon />
            </View>
            <View style={s.headerText}>
              <Text style={s.title}>Set Travel Time</Text>
              <Text style={s.subtitle}>Choose hour, minute & period</Text>
            </View>
            {/* Live preview badge */}
            <LinearGradient colors={[BRAND_GREEN, BRAND_MID]} style={s.previewBadge}>
              <Text style={s.previewText}>{previewLabel}</Text>
            </LinearGradient>
          </View>

          {/* ── Accent line ── */}
          <LinearGradient
            colors={[BRAND_GREEN, BRAND_MID, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.accentLine}
          />

          {/* Drums */}
          <View style={s.drumsRow}>
            {/* Hour */}
            <View style={s.drumCol}>
              <Text style={s.drumLabel}>HOUR</Text>
              <Drum data={hours}   selected={hour}   onSelect={setHour}   pickerVisible={visible} />
            </View>

            {/* Colon */}
            <View style={s.colonCol}>
              <Text style={s.colon}>:</Text>
            </View>

            {/* Minute */}
            <View style={s.drumCol}>
              <Text style={s.drumLabel}>MIN</Text>
              <Drum data={minutes} selected={minute} onSelect={setMinute} pickerVisible={visible} />
            </View>

            {/* Separator */}
            <View style={s.sep} />

            {/* AM / PM */}
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

          {/* Footer */}
          <View style={s.footer}>
             <TouchableOpacity style={s.btnCancel} onPress={onClose} activeOpacity={0.7}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#64748B" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={s.btnCancelText}>Back</Text>
              </TouchableOpacity>
            
            <Animated.View style={[s.btnConfirm, { transform: [{ scale: confirmScale }] }]}>
              <TouchableOpacity style={{ flex: 1 }} onPress={handleConfirmPress} activeOpacity={0.85}>
                <LinearGradient
                  colors={[BRAND_GREEN, '#004D3A']}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 30,
  },
  handle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  
  // ── Header ──
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
    backgroundColor: BRAND_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: 'Manrope-Bold',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Manrope-Medium',
    marginTop: 2,
  },
  previewBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  previewText: {
    color: '#fff',
    fontFamily: 'Manrope-Bold',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },

  // ── Accent line ──
  accentLine: {
    height: 2,
    borderRadius: 2,
    marginBottom: 10,
  },

  // Drums row
  drumsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    height: DRUM_H + 32, // Accommodate labels + drum
  },
  drumCol: { flex: 1, alignItems: 'center', height: '100%'},
  drumLabel: {
    fontSize: 10, fontWeight: '800',
    color: '#94A3B8', letterSpacing: 1.5,
    marginBottom: 12, fontFamily: 'Manrope-Bold',
  },
  colonCol: {
    paddingTop: 32,
    alignItems: 'center',
  },
  colon: {
    fontSize: 30, color: '#CBD5E1',
    fontWeight: '300', marginHorizontal: 2,
  },
  sep: {
    width: 1,
    height: '60%',
    backgroundColor: '#F1F5F9',
    marginTop: 28, marginHorizontal: 6,
  },

  // AM / PM
  periodCol: { width: 100, alignItems: 'center', height: '100%' },
  periodWrap: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 4,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
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
    backgroundColor: '#fff',
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: BRAND_LIGHT,
  },
  periodText: {
    fontSize: 14, color: '#94A3B8',
    fontWeight: '700', fontFamily: 'Manrope-Bold',
  },
  periodActiveText: {
    color: BRAND_GREEN, fontSize: 15, fontWeight: '800',
  },

  // Footer
  footer: { flexDirection: 'row', gap: 12, marginTop: 4 },
  btnCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnCancelText: {
    fontSize: 15, fontWeight: '700',
    color: '#64748B', fontFamily: 'Manrope-Bold',
  },
  btnConfirm: { flex: 1, height: 56, borderRadius: 18, overflow: 'hidden' },
  btnGradient: { 
    flex: 1, justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row', gap: 8 
  },
  btnConfirmText: {
    fontSize: 16, fontWeight: '800',
    color: '#fff', fontFamily: 'Manrope-Bold',
  },
});

export default CustomTimePicker;
