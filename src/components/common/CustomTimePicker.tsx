import React, { useMemo } from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { AppTheme } from '../../constants/Colors';

interface CustomTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (time: string) => void;
  selectedTime?: string;
  theme?: AppTheme;
}

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  visible,
  onClose,
  onSelectTime,
  selectedTime,
  theme,
}) => {
  const initialDate = useMemo(() => {
    if (!selectedTime) return new Date();
    const m = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) return new Date();
    
    let hr = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const ampm = m[3].toUpperCase();
    
    if (ampm === 'PM' && hr < 12) hr += 12;
    if (ampm === 'AM' && hr === 12) hr = 0;
    
    const date = new Date();
    date.setHours(hr, min, 0, 0);
    return date;
  }, [selectedTime]);

  const handleConfirm = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hr = hours % 12 || 12;
    const formattedTime = `${String(hr).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
    
    onSelectTime(formattedTime);
    onClose();
  };

  return (
    <DateTimePickerModal
      isVisible={visible}
      mode="time"
      date={initialDate}
      onConfirm={handleConfirm}
      onCancel={onClose}
      themeVariant={theme?.isDark ? "dark" : "light"}
    />
  );
};

export default CustomTimePicker;
