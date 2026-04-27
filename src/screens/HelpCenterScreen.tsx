import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Typography } from '../constants/Typography';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  {
    category: 'Delivery',
    icon: 'cube-outline',
    questions: [
      {
        q: 'How do I track my parcel?',
        a: 'You can track your parcel from the "My Shipments" section. Select your active shipment to see its real-time status.',
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
        q: 'When do I get paid as a traveler?',
        a: 'Travelers are paid once the parcel is marked as "Delivered" and the customer confirms receipt. Funds will appear in your wallet.',
      },
      {
        q: 'Is my payment secure?',
        a: 'Yes, DropMate uses encrypted payment gateways and holds funds in escrow until the delivery is successfully completed.',
      },
    ],
  },
  {
    category: 'Account',
    icon: 'person-outline',
    questions: [
      {
        q: 'How do I change my phone number?',
        a: 'For security reasons, phone number changes must be handled by our support team. Please use the chat feature below.',
      },
    ],
  },
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
  if (name === 'chatbubble-ellipses') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L21 4.5l-3.6 3.6z" />
    </Svg>
  );
  return null;
};

const HelpCenterScreen = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#006C52', '#004A38']}
          style={styles.heroCard}
        >
          <Text style={styles.heroTitle}>How can we help you?</Text>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for topics..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </LinearGradient>

        {/* FAQ Sections */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        {FAQS.map((category, catIdx) => (
          <View key={catIdx} style={styles.categoryContainer}>
            <View style={styles.categoryHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                <Icon name={category.icon as any} size={20} color="#006C52" />
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
                      color="#666" 
                    />
                  </View>
                  {isExpanded && (
                    <Text style={styles.answerText}>{item.a}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Contact Support Section */}
        <View style={styles.contactCard}>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Still need help?</Text>
            <Text style={styles.contactSubtitle}>Our support team is available 24/7 to assist you with any issues.</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={() => navigation.navigate('SupportChat')}
          >
            <LinearGradient
              colors={['#006C52', '#004A38']}
              style={styles.chatButtonGradient}
            >
              <Icon name="chatbubble-ellipses" size={20} color="#FFF" />
              <Text style={styles.chatButtonText}>Chat with Support</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    color: '#1A1A1A',
    fontFamily: Typography.extraBold,
  },
  scrollContent: {
    padding: 20,
  },
  heroCard: {
    padding: 25,
    borderRadius: 24,
    marginBottom: 25,
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 24,
    color: '#FFF',
    marginBottom: 20,
    fontFamily: Typography.bold,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#1A1A1A',
    fontFamily: Typography.regular,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Typography.bold,
    color: '#1A1A1A',
    marginBottom: 20,
  },
  categoryContainer: {
    marginBottom: 25,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  categoryName: {
    fontSize: 15,
    fontFamily: Typography.bold,
    color: '#666',
  },
  faqItem: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  faqItemExpanded: {
    borderColor: '#006C52',
    backgroundColor: '#F1F8F6',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionText: {
    fontSize: 15,
    fontFamily: Typography.bold,
    color: '#1A1A1A',
    flex: 1,
    marginRight: 15,
  },
  answerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 12,
    fontFamily: Typography.regular,
  },
  contactCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 25,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  contactInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 18,
    fontFamily: Typography.bold,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
    fontFamily: Typography.regular,
  },
  chatButton: {
    width: '100%',
  },
  chatButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  chatButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: Typography.bold,
  },
});

export default HelpCenterScreen;
