import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { Typography } from '../../constants/Typography';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  title: string;
  subtitle: string;
}

const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  onSubmit,
  title,
  subtitle,
}) => {
  const { theme } = useTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRating = (value: number) => {
    setRating(value);
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await onSubmit(rating, comment);
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Rating submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRating(star)}
            activeOpacity={0.7}
            style={styles.starTouch}
          >
            <Svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill={star <= rating ? '#F59E0B' : 'none'}
              stroke={star <= rating ? '#F59E0B' : theme.text.tertiary}
              strokeWidth="1.5"
            >
              <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
            </Svg>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={[styles.content, { backgroundColor: theme.isDark ? '#1F2937' : '#FFFFFF' }]}>
            <Text style={[styles.title, { color: theme.text.primary }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: theme.text.secondary }]}>{subtitle}</Text>

            {renderStars()}

            <TextInput
              style={[
                styles.commentInput,
                {
                  backgroundColor: theme.isDark ? '#374151' : '#F3F4F6',
                  color: theme.text.primary,
                  borderColor: theme.border,
                  
                },
              ]}
              placeholder="What could be improved? (Optional)"
              placeholderTextColor={theme.text.tertiary}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={[styles.cancelText, { color: theme.text.secondary }]}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, { opacity: rating === 0 ? 0.6 : 1 }]}
                onPress={handleSubmit}
                disabled={rating === 0 || submitting}
              >
                <LinearGradient
                  colors={['#006C52', '#004D3A']}
                  style={styles.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitText}>Submit Rating</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  title: {
    fontSize: 22,
    fontFamily: Typography.extraBold,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Typography.medium,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  starTouch: {
    padding: 6,
  },
  commentInput: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    height: 100,
    fontSize: 15,
    fontFamily: Typography.medium,
    borderWidth: 1,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontFamily: Typography.bold,
  },
  submitButton: {
    flex: 2,
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Typography.extraBold,
  },
});

export default RatingModal;
