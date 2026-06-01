import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Typography } from '../constants/Typography';
import BackButton from '../components/common/BackButton';
import CustomInput from '../components/common/CustomInput';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COMMON_FAQS = [
  {
    category: 'Account',
    icon: 'person-outline',
    questions: [
      {
        q: 'How do I change my phone number?',
        a: 'For security reasons, phone number changes must be handled by our support team. Please use the chat feature below.',
      },
      {
        q: 'Is my data secure?',
        a: 'Yes, DropMate uses industry-standard encryption and security protocols to protect your personal information.',
      },
    ],
  },
];

const CUSTOMER_FAQS = [
  {
    category: 'Sending Parcels',
    icon: 'cube-outline',
    questions: [
      {
        q: 'How do I send a parcel?',
        a: 'Tap the "Find Travelers" button on the home screen and choose a traveler that fits your schedule.',
      },
      {
        q: 'How do I track my parcel?',
        a: 'You can track your parcel from the "Shipments" section. Select your active shipment to see its real-time status.',
      },
      {
        q: 'What if my traveler is late?',
        a: 'If a traveler is delayed, we recommend contacting them directly via the phone number provided. You can also reach out to our support team.',
      },
    ],
  },
  {
    category: 'Payments',
    icon: 'card-outline',
    questions: [
      {
        q: 'Is my payment secure?',
        a: 'Yes, DropMate uses encrypted payment gateways and holds funds in escrow until the delivery is successfully completed.',
      },
      {
        q: 'Can I get a refund?',
        a: 'Refunds are available if a traveler fails to pick up or deliver your parcel. Contact support for assistance.',
      },
    ],
  },
  ...COMMON_FAQS,
];

const TRAVELER_FAQS = [
  {
    category: 'Delivering Parcels',
    icon: 'cube-outline',
    questions: [
      {
        q: 'How do I accept a delivery request?',
        a: 'When a customer requests a delivery, a popup modal will appear on your screen. You have 15 minutes to accept or decline the request, if no action is taken, it will be automatically rejected.',
      },
      {
        q: 'What if the receiver is not available?',
        a: 'If the receiver cannot be reached, contact the customer. If they still dont respond, contact DropMate support for next steps.',
      },
      {
        q: 'Are there weight limits?',
        a: 'Yes, weight limits are based on your vehicle type and the capacity you specified during registration.',
      },
    ],
  },
  {
    category: 'Earnings',
    icon: 'card-outline',
    questions: [
      {
        q: 'When do I get paid?',
        a: 'Travelers are paid once the parcel is marked as "Delivered" and the customer confirms receipt. Funds will appear in your wallet.',
      },
      {
        q: 'How do I withdraw my earnings?',
        a: 'You can withdraw your earnings from the "My Earnings" section by linking a valid bank account.',
      },
    ],
  },
  ...COMMON_FAQS,
];

const Icon = ({ name, size = 24, color = "#000", style }: any) => {
  if (name === 'chevron-back') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M15 18l-6-6 6-6" />
    </Svg>
  );
  if (name === 'search') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Circle cx="11" cy="11" r="8" />
      <Path d="M21 21l-4.35-4.35" />
    </Svg>
  );
  if (name === 'cube-outline') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05" />
      <Path d="M12 22.08V12" />
    </Svg>
  );
  if (name === 'card-outline') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <Path d="M1 10h22" />
    </Svg>
  );
  if (name === 'person-outline') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
  if (name === 'chevron-down') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M6 9l6 6 6-6" />
    </Svg>
  );
  if (name === 'chevron-up') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M18 15l-6-6-6 6" />
    </Svg>
  );
  if (name === 'headset') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z" />
      <Path d="M21 16v2a4 4 0 0 1-4 4h-5" />
    </Svg>
  );
  return null;
};

const HelpCenterScreen = () => {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

  const activeFAQS = user?.roleActive === 'TRAVELER' ? TRAVELER_FAQS : CUSTOMER_FAQS;

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === id ? null : id);
  };

  return (
    <View style={styles.container}>
       <StatusBar barStyle={theme.statusBar} backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <BackButton
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            color={theme.primary}
          />
          <Text style={styles.headerTitle}>Help Center</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Hero Section */}
          <View style={styles.heroCardContainer}>
            <View style={styles.heroCard}>
              <LinearGradient
                colors={[theme.primary, theme.primaryDark]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.heroTitle}>How can we help you?</Text>
              <CustomInput 
                placeholder="Search for topics..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                icon={<Icon name="search" size={20} color={theme.isDark ? "#FFF" : "#006C52"} />}
                theme={theme}
                containerStyle={styles.searchCustomStyle}
                inputWrapperStyle={styles.searchInputWrapper}
                inputStyle={styles.searchTextInput}
                placeholderTextColor={theme.isDark ? "rgba(255,255,255,0.6)" : "#999"}
              />
            </View>
          </View>

          {/* FAQ Sections */}
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {(() => {
            const filteredFAQS = activeFAQS.map(category => {
              const filteredQuestions = category.questions.filter(item => 
                item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                item.a.toLowerCase().includes(searchQuery.toLowerCase())
              );
              return { ...category, questions: filteredQuestions };
            }).filter(category => category.questions.length > 0);

            if (filteredFAQS.length === 0) {
              return (
                <View style={{ alignItems: 'center', marginVertical: 30 }}>
                  <Text style={{ color: theme.text.tertiary, fontFamily: Typography.medium, fontSize: 16 }}>No results found for "{searchQuery}"</Text>
                </View>
              );
            }

            return filteredFAQS.map((category, catIdx) => (
              <View key={catIdx} style={styles.categoryContainer}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.iconBox, { backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.1)' : '#E8F5E9' }]}>
                    <Icon name={category.icon as any} size={18} color={theme.isDark ? theme.primary : '#006C52'} />
                  </View>
                  <Text style={styles.categoryName}>{category.category}</Text>
                </View>

                {category.questions.map((item, qIdx) => {
                  const id = `${catIdx}-${qIdx}`;
                  const isExpanded = expandedIndex === id;
                  
                  return (
                    <TouchableOpacity 
                      key={qIdx} 
                      style={[styles.faqItem, isExpanded && styles.faqItemExpanded]}
                      onPress={() => toggleExpand(id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.questionRow}>
                        <Text style={styles.questionText}>{item.q}</Text>
                        <Icon 
                          name={isExpanded ? "chevron-up" : "chevron-down"} 
                          size={18} 
                          color={isExpanded ? theme.primary : theme.text.tertiary} 
                        />
                      </View>
                      {isExpanded && (
                        <Text style={styles.answerText}>{item.a}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ));
          })()}

          {/* Contact Support Section */}
          <View style={styles.contactCardContainer}>
            <View style={styles.contactCard}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Still need help?</Text>
                <Text style={styles.contactSubtitle}>Our support team is available 24/7 to assist you with any issues.</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.chatButton}
                onPress={() => navigation.navigate('SupportChat')}
                activeOpacity={0.8}
              >
                <View style={styles.chatButtonShadow}>
                  <View style={styles.chatButtonInner}>
                    <LinearGradient
                      colors={[theme.primary, theme.primaryDark]}
                      style={StyleSheet.absoluteFill}
                    />
                    <Icon name="headset" size={20} color="#FFF" />
                    <Text style={[styles.chatButtonText, { backgroundColor: 'transparent' }]}>Chat with Support</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    color: theme.text.primary,
    fontFamily: Typography.extraBold,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60, // Added significant extra padding at bottom
  },
  heroCardContainer: {
    marginBottom: 30,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 10,
    borderRadius: 28,
  },
  heroCard: {
    padding: 28,
    paddingBottom: 40,
    borderRadius: 28,
    overflow: 'hidden', // Now we can use it safely because the shadow is on heroCardContainer
  },
  heroTitle: {
    fontSize: 26,
    color: '#FFF',
    marginBottom: 20,
    fontFamily: Typography.bold,
    letterSpacing: -0.5,
  },
  searchCustomStyle: {
    marginBottom: 0,
  },
  searchInputWrapper: {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.15)' : '#FFF',
    borderWidth: 0,
    height: 54,
  },
  searchTextInput: {
    color: theme.isDark ? '#FFF' : '#004A38',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 19,
    fontFamily: Typography.bold,
    color: theme.text.primary,
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  categoryContainer: {
    marginBottom: 30,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: Typography.bold,
    color: theme.text.secondary,
  },
  faqItem: {
    paddingVertical: 20,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  faqItemExpanded: {
    borderBottomColor: theme.primary,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionText: {
    fontSize: 15,
    fontFamily: Typography.bold,
    color: theme.text.primary,
    flex: 1,
    marginRight: 15,
    lineHeight: 20,
  },
  answerText: {
    fontSize: 14.5,
    color: theme.text.secondary,
    lineHeight: 22,
    marginTop: 15,
    fontFamily: Typography.medium,
    paddingRight: 10,
  },
  contactCardContainer: {
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
    borderRadius: 28,
  },
  contactCard: {
    backgroundColor: theme.card,
    borderRadius: 28,
    padding: 30,
    paddingBottom: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden', // Now we can use it safely because the shadow is on contactCardContainer
  },
  contactInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  contactTitle: {
    fontSize: 20,
    fontFamily: Typography.bold,
    color: theme.text.primary,
    marginBottom: 8,
  },
  contactSubtitle: {
    fontSize: 14.5,
    color: theme.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    fontFamily: Typography.medium,
  },
  chatButton: {
    width: '100%',
  },
  chatButtonShadow: {
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    borderRadius: 18,
    backgroundColor: theme.primary, // Required for iOS shadow
  },
  chatButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 18,
    gap: 12,
    overflow: 'hidden',
  },
  chatButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontFamily: Typography.bold,
  },
});

export default HelpCenterScreen;
