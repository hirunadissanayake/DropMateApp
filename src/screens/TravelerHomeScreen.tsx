import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Rect, G, Defs, ClipPath } from 'react-native-svg';
import { useAuthStore } from '../store/authStore';

const { width } = Dimensions.get('window');

const TravelerHomeScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const userName = user?.name || 'Traveler';

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#E7FFF2', '#FFFFFF']}
        locations={[0, 0.4]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Main Scroll Content */}
      <View style={styles.scrollWrapper}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header area padding to prevent content from going under the absolute floating header */}
          <View style={{ height: 110 }} />

          {/* Greeting Area */}
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingSubtitle}>Good Morning,</Text>
            <Text style={styles.greetingTitle}>{userName}</Text>
          </View>

          {/* Under Review Card */}
          <View style={styles.reviewCard}>
            <View style={styles.reviewCardBgCircle} />
            <View style={styles.reviewHeaderRow}>
              <View style={styles.reviewBadge}>
                <Svg width="12" height="13" viewBox="0 0 12 13" fill="none">
                  <Path d="M8.16667 12.25C7.35972 12.25 6.67188 11.9656 6.10313 11.3969C5.53438 10.8281 5.25 10.1403 5.25 9.33333C5.25 8.52639 5.53438 7.83854 6.10313 7.26979C6.67188 6.70104 7.35972 6.41667 8.16667 6.41667C8.97361 6.41667 9.66146 6.70104 10.2302 7.26979C10.799 7.83854 11.0833 8.52639 11.0833 9.33333C11.0833 10.1403 10.799 10.8281 10.2302 11.3969C9.66146 11.9656 8.97361 12.25 8.16667 12.25ZM9.14375 10.7188L9.55208 10.3104L8.45833 9.21667V7.58333H7.875V9.45L9.14375 10.7188ZM1.16667 11.6667C0.845833 11.6667 0.571181 11.5524 0.342708 11.324C0.114236 11.0955 0 10.8208 0 10.5V2.33333C0 2.0125 0.114236 1.73785 0.342708 1.50937C0.571181 1.2809 0.845833 1.16667 1.16667 1.16667H3.60208C3.70903 0.826389 3.91806 0.546875 4.22917 0.328125C4.54028 0.109375 4.88056 0 5.25 0C5.63889 0 5.98646 0.109375 6.29271 0.328125C6.59896 0.546875 6.80556 0.826389 6.9125 1.16667H9.33333C9.65417 1.16667 9.92882 1.2809 10.1573 1.50937C10.3858 1.73785 10.5 2.0125 10.5 2.33333V5.97917C10.325 5.85278 10.1403 5.74583 9.94583 5.65833C9.75139 5.57083 9.54722 5.49306 9.33333 5.425V2.33333H8.16667V4.08333H2.33333V2.33333H1.16667V10.5H4.25833C4.32639 10.7139 4.40417 10.9181 4.49167 11.1125C4.57917 11.3069 4.68611 11.4917 4.8125 11.6667H1.16667ZM5.25 2.33333C5.41528 2.33333 5.55382 2.27743 5.66563 2.16563C5.77743 2.05382 5.83333 1.91528 5.83333 1.75C5.83333 1.58472 5.77743 1.44618 5.66563 1.33438C5.55382 1.22257 5.41528 1.16667 5.25 1.16667C5.08472 1.16667 4.94618 1.22257 4.83437 1.33438C4.72257 1.44618 4.66667 1.58472 4.66667 1.75C4.66667 1.91528 4.72257 2.05382 4.83437 2.16563C4.94618 2.27743 5.08472 2.33333 5.25 2.33333Z" fill="#4A695C"/>
                </Svg>
                <Text style={styles.reviewBadgeText}>UNDER REVIEW</Text>
              </View>
              <Svg width="24" height="30" viewBox="0 0 24 30" fill="none">
                <Path d="M10.425 20.325L18.9 11.85L16.7625 9.7125L10.425 16.05L7.275 12.9L5.1375 15.0375L10.425 20.325ZM12 30C8.525 29.125 5.65625 27.1312 3.39375 24.0187C1.13125 20.9062 0 17.45 0 13.65V4.5L12 0L24 4.5V13.65C24 17.45 22.8688 20.9062 20.6063 24.0187C18.3438 27.1312 15.475 29.125 12 30ZM12 26.85C14.6 26.025 16.75 24.375 18.45 21.9C20.15 19.425 21 16.675 21 13.65V6.5625L12 3.1875L3 6.5625V13.65C3 16.675 3.85 19.425 5.55 21.9C7.25 24.375 9.4 26.025 12 26.85Z" fill="#9DF4D2" fillOpacity="0.4"/>
              </Svg>
            </View>
            <Text style={styles.reviewTitle}>Verification in Progress</Text>
            <Text style={styles.reviewBody}>
              Our team is currently validating your documents. This process usually takes 24- 48 hours to maintain the highest security standards.
            </Text>
            <View style={styles.reviewProgressBarTrack}>
              <View style={[styles.reviewProgressBarFill, { width: '70%' }]} />
            </View>
          </View>

          {/* Complete your profile */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeaderRow}>
              <Text style={styles.profileTitle}>Complete your profile</Text>
              <Text style={styles.profilePercent}>85%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '85%' }]} />
            </View>
            <Text style={styles.profileHintText}>Add your local bank details to reach 100%.</Text>
          </View>

          {/* Locked Services */}
          <View style={styles.lockedServicesContainer}>
            {/* Available Routes */}
            <View style={styles.lockedServiceCard}>
              <View style={styles.lockedIconContainer}>
                <Svg width="18" height="18" viewBox="0 0 18 18" fill="none"><Path d="M6 18C4.9 18 3.95833 17.6083 3.175 16.825C2.39167 16.0417 2 15.1 2 14V5.825C1.41667 5.60833 0.9375 5.24583 0.5625 4.7375C0.1875 4.22917 0 3.65 0 3C0 2.16667 0.291667 1.45833 0.875 0.875C1.45833 0.291667 2.16667 0 3 0C3.83333 0 4.54167 0.291667 5.125 0.875C5.70833 1.45833 6 2.16667 6 3C6 3.65 5.8125 4.22917 5.4375 4.7375C5.0625 5.24583 4.58333 5.60833 4 5.825V14C4 14.55 4.19583 15.0208 4.5875 15.4125C4.97917 15.8042 5.45 16 6 16C6.55 16 7.02083 15.8042 7.4125 15.4125C7.80417 15.0208 8 14.55 8 14V4C8 2.9 8.39167 1.95833 9.175 1.175C9.95833 0.391667 10.9 0 12 0C13.1 0 14.0417 0.391667 14.825 1.175C15.6083 1.95833 16 2.9 16 4V12.175C16.5833 12.3917 17.0625 12.7542 17.4375 13.2625C17.8125 13.7708 18 14.35 18 15C18 15.8333 17.7083 16.5417 17.125 17.125C16.5417 17.7083 15.8333 18 15 18C14.1667 18 13.4583 17.7083 12.875 17.125C12.2917 16.5417 12 15.8333 12 15C12 14.35 12.1875 13.7667 12.5625 13.25C12.9375 12.7333 13.4167 12.375 14 12.175V4C14 3.45 13.8042 2.97917 13.4125 2.5875C13.0208 2.19583 12.55 2 12 2C11.45 2 10.9792 2.19583 10.5875 2.5875C10.1958 2.97917 10 3.45 10 4V14C10 15.1 9.60833 16.0417 8.825 16.825C8.04167 17.6083 7.1 18 6 18ZM3 4C3.28333 4 3.52083 3.90417 3.7125 3.7125C3.90417 3.52083 4 3.28333 4 3C4 2.71667 3.90417 2.47917 3.7125 2.2875C3.52083 2.09583 3.28333 2 3 2C2.71667 2 2.47917 2.09583 2.2875 2.2875C2.09583 2.47917 2 2.71667 2 3C2 3.28333 2.09583 3.52083 2.2875 3.7125C2.47917 3.90417 2.71667 4 3 4ZM15 16C15.2833 16 15.5208 15.9042 15.7125 15.7125C15.9042 15.5208 16 15.2833 16 15C16 14.7167 15.9042 14.4792 15.7125 14.2875C15.5208 14.0958 15.2833 14 15 14C14.7167 14 14.4792 14.0958 14.2875 14.2875C14.0958 14.4792 14 14.7167 14 15C14 15.2833 14.0958 15.5208 14.2875 15.7125C14.4792 15.9042 14.7167 16 15 16Z" fill="#00513D"/></Svg>
              </View>
              <View style={styles.lockedServiceContent}>
                <Text style={styles.lockedServiceTitle}>Available Routes</Text>
                <Text style={styles.lockedServiceDesc}>Explore corridors with high demand.</Text>
              </View>
              <View style={styles.lockedBadgeContainer}>
                <Svg width="12" height="16" viewBox="0 0 12 16" fill="none"><Path d="M1.5 15.75C1.0875 15.75 0.734375 15.6031 0.440625 15.3094C0.146875 15.0156 0 14.6625 0 14.25V6.75C0 6.3375 0.146875 5.98438 0.440625 5.69063C0.734375 5.39688 1.0875 5.25 1.5 5.25H2.25V3.75C2.25 2.7125 2.61562 1.82812 3.34687 1.09687C4.07812 0.365625 4.9625 0 6 0C7.0375 0 7.92188 0.365625 8.65312 1.09687C9.38437 1.82812 9.75 2.7125 9.75 3.75V5.25H10.5C10.9125 5.25 11.2656 5.39688 11.5594 5.69063C11.8531 5.98438 12 6.3375 12 6.75V14.25C12 14.6625 11.8531 15.0156 11.5594 15.3094C11.2656 15.6031 10.9125 15.75 10.5 15.75H1.5ZM1.5 14.25H10.5V6.75H1.5V14.25ZM6 12C6.4125 12 6.76562 11.8531 7.05937 11.5594C7.35312 11.2656 7.5 10.9125 7.5 10.5C7.5 10.0875 7.35312 9.73438 7.05937 9.44063C6.76562 9.14688 6.4125 9 6 9C5.5875 9 5.23438 9.14688 4.94063 9.44063C4.64688 9.73438 4.5 10.0875 4.5 10.5C4.5 10.9125 4.64688 11.2656 4.94063 11.5594C5.23438 11.8531 5.5875 12 6 12ZM3.75 5.25H8.25V3.75C8.25 3.125 8.03125 2.59375 7.59375 2.15625C7.15625 1.71875 6.625 1.5 6 1.5C5.375 1.5 4.84375 1.71875 4.40625 2.15625C3.96875 2.59375 3.75 3.125 3.75 3.75V5.25ZM1.5 14.25V6.75V14.25Z" fill="#052017"/></Svg>
                <Text style={styles.lockedText}>LOCKED</Text>
              </View>
            </View>

            {/* Earnings */}
            <View style={styles.lockedServiceCard}>
              <View style={styles.lockedIconContainer}>
                <Svg width="22" height="16" viewBox="0 0 22 16" fill="none"><Path d="M13 9C12.1667 9 11.4583 8.70833 10.875 8.125C10.2917 7.54167 10 6.83333 10 6C10 5.16667 10.2917 4.45833 10.875 3.875C11.4583 3.29167 12.1667 3 13 3C13.8333 3 14.5417 3.29167 15.125 3.875C15.7083 4.45833 16 5.16667 16 6C16 6.83333 15.7083 7.54167 15.125 8.125C14.5417 8.70833 13.8333 9 13 9ZM6 12C5.45 12 4.97917 11.8042 4.5875 11.4125C4.19583 11.0208 4 10.55 4 10V2C4 1.45 4.19583 0.979167 4.5875 0.5875C4.97917 0.195833 5.45 0 6 0H20C20.55 0 21.0208 0.195833 21.4125 0.5875C21.8042 0.979167 22 1.45 22 2V10C22 10.55 21.8042 11.0208 21.4125 11.4125C21.0208 11.8042 20.55 12 20 12H6ZM8 10H18C18 9.45 18.1958 8.97917 18.5875 8.5875C18.9792 8.19583 19.45 8 20 8V4C19.45 4 18.9792 3.80417 18.5875 3.4125C18.1958 3.02083 18 2.55 18 2H8C8 2.55 7.80417 3.02083 7.4125 3.4125C7.02083 3.80417 6.55 4 6 4V8C6.55 8 7.02083 8.19583 7.4125 8.5875C7.80417 8.97917 8 9.45 8 10ZM19 16H2C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V3H2V14H19V16ZM6 10V2V10Z" fill="#00513D"/></Svg>
              </View>
              <View style={styles.lockedServiceContent}>
                <Text style={styles.lockedServiceTitle}>Earnings</Text>
                <Text style={styles.lockedServiceDesc}>Track your courier revenue in real-time.</Text>
              </View>
              <View style={styles.lockedBadgeContainer}>
                 <Svg width="12" height="16" viewBox="0 0 12 16" fill="none"><Path d="M1.5 15.75C1.0875 15.75 0.734375 15.6031 0.440625 15.3094C0.146875 15.0156 0 14.6625 0 14.25V6.75C0 6.3375 0.146875 5.98438 0.440625 5.69063C0.734375 5.39688 1.0875 5.25 1.5 5.25H2.25V3.75C2.25 2.7125 2.61562 1.82812 3.34687 1.09687C4.07812 0.365625 4.9625 0 6 0C7.0375 0 7.92188 0.365625 8.65312 1.09687C9.38437 1.82812 9.75 2.7125 9.75 3.75V5.25H10.5C10.9125 5.25 11.2656 5.39688 11.5594 5.69063C11.8531 5.98438 12 6.3375 12 6.75V14.25C12 14.6625 11.8531 15.0156 11.5594 15.3094C11.2656 15.6031 10.9125 15.75 10.5 15.75H1.5ZM1.5 14.25H10.5V6.75H1.5V14.25ZM6 12C6.4125 12 6.76562 11.8531 7.05937 11.5594C7.35312 11.2656 7.5 10.9125 7.5 10.5C7.5 10.0875 7.35312 9.73438 7.05937 9.44063C6.76562 9.14688 6.4125 9 6 9C5.5875 9 5.23438 9.14688 4.94063 9.44063C4.64688 9.73438 4.5 10.0875 4.5 10.5C4.5 10.9125 4.64688 11.2656 4.94063 11.5594C5.23438 11.8531 5.5875 12 6 12ZM3.75 5.25H8.25V3.75C8.25 3.125 8.03125 2.59375 7.59375 2.15625C7.15625 1.71875 6.625 1.5 6 1.5C5.375 1.5 4.84375 1.71875 4.40625 2.15625C3.96875 2.59375 3.75 3.125 3.75 3.75V5.25ZM1.5 14.25V6.75V14.25Z" fill="#052017"/></Svg>
                 <Text style={styles.lockedText}>LOCKED</Text>
              </View>
            </View>

            {/* Wallet */}
            <View style={styles.lockedServiceCard}>
              <View style={styles.lockedIconContainer}>
                <Svg width="19" height="18" viewBox="0 0 19 18" fill="none"><Path d="M2 16V2C2 2 2 2.37083 2 3.1125C2 3.85417 2 4.81667 2 6V12C2 13.1833 2 14.1458 2 14.8875C2 15.6292 2 16 2 16ZM2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H16C16.55 0 17.0208 0.195833 17.4125 0.5875C17.8042 0.979167 18 1.45 18 2V4.5H16V2H2V16H16V13.5H18V16C18 16.55 17.8042 17.0208 17.4125 17.4125C17.0208 17.8042 16.55 18 16 18H2ZM10 14C9.45 14 8.97917 13.8042 8.5875 13.4125C8.19583 13.0208 8 12.55 8 12V6C8 5.45 8.19583 4.97917 8.5875 4.5875C8.97917 4.19583 9.45 4 10 4H17C17.55 4 18.0208 4.19583 18.4125 4.5875C18.8042 4.97917 19 5.45 19 6V12C19 12.55 18.8042 13.0208 18.4125 13.4125C18.0208 13.8042 17.55 14 17 14H10ZM17 12V6H10V12H17ZM13 10.5C13.4167 10.5 13.7708 10.3542 14.0625 10.0625C14.3542 9.77083 14.5 9.41667 14.5 9C14.5 8.58333 14.3542 8.22917 14.0625 7.9375C13.7708 7.64583 13.4167 7.5 13 7.5C12.5833 7.5 12.2292 7.64583 11.9375 7.9375C11.6458 8.22917 11.5 8.58333 11.5 9C11.5 9.41667 11.6458 9.77083 11.9375 10.0625C12.2292 10.3542 12.5833 10.5 13 10.5Z" fill="#00513D"/></Svg>
              </View>
              <View style={styles.lockedServiceContent}>
                <Text style={styles.lockedServiceTitle}>Wallet</Text>
                <Text style={styles.lockedServiceDesc}>Manage payouts and linked accounts.</Text>
              </View>
              <View style={styles.lockedBadgeContainer}>
                 <Svg width="12" height="16" viewBox="0 0 12 16" fill="none"><Path d="M1.5 15.75C1.0875 15.75 0.734375 15.6031 0.440625 15.3094C0.146875 15.0156 0 14.6625 0 14.25V6.75C0 6.3375 0.146875 5.98438 0.440625 5.69063C0.734375 5.39688 1.0875 5.25 1.5 5.25H2.25V3.75C2.25 2.7125 2.61562 1.82812 3.34687 1.09687C4.07812 0.365625 4.9625 0 6 0C7.0375 0 7.92188 0.365625 8.65312 1.09687C9.38437 1.82812 9.75 2.7125 9.75 3.75V5.25H10.5C10.9125 5.25 11.2656 5.39688 11.5594 5.69063C11.8531 5.98438 12 6.3375 12 6.75V14.25C12 14.6625 11.8531 15.0156 11.5594 15.3094C11.2656 15.6031 10.9125 15.75 10.5 15.75H1.5ZM1.5 14.25H10.5V6.75H1.5V14.25ZM6 12C6.4125 12 6.76562 11.8531 7.05937 11.5594C7.35312 11.2656 7.5 10.9125 7.5 10.5C7.5 10.0875 7.35312 9.73438 7.05937 9.44063C6.76562 9.14688 6.4125 9 6 9C5.5875 9 5.23438 9.14688 4.94063 9.44063C4.64688 9.73438 4.5 10.0875 4.5 10.5C4.5 10.9125 4.64688 11.2656 4.94063 11.5594C5.23438 11.8531 5.5875 12 6 12ZM3.75 5.25H8.25V3.75C8.25 3.125 8.03125 2.59375 7.59375 2.15625C7.15625 1.71875 6.625 1.5 6 1.5C5.375 1.5 4.84375 1.71875 4.40625 2.15625C3.96875 2.59375 3.75 3.125 3.75 3.75V5.25ZM1.5 14.25V6.75V14.25Z" fill="#052017"/></Svg>
                 <Text style={styles.lockedText}>LOCKED</Text>
              </View>
            </View>
          </View>

          {/* Tips for Travelers */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsHeader}>Tips for Travelers</Text>
            
            <View style={styles.tipsCardImage}>
              <View style={styles.tipsImgContainer}>
                 <View style={{width: '100%', height: '100%', backgroundColor: 'rgba(0,108,82,0.1)'}} />
              </View>
              <View style={styles.tipsTextContent}>
                <Text style={styles.tipsTitle}>Maximize Earnings</Text>
                <Text style={styles.tipsDesc}>Learn how to batch multiple deliveries along a single journey to triple your hourly rate.</Text>
              </View>
            </View>

            <View style={styles.tipsCardStandard}>
              <View>
                <View style={styles.tipsIconBox}>
                  <Svg width="20" height="19" viewBox="0 0 20 19" fill="none"><Path d="M6.85 14.825L10 12.925L13.15 14.85L12.325 11.25L15.1 8.85L11.45 8.525L10 5.125L8.55 8.5L4.9 8.825L7.675 11.25L6.85 14.825ZM3.825 19L5.45 11.975L0 7.25L7.2 6.625L10 0L12.8 6.625L20 7.25L14.55 11.975L16.175 19L10 15.275L3.825 19Z" fill="#00513D"/></Svg>
                </View>
                <Text style={[styles.tipsTitle, {marginTop: 12}]}>Maintain 5-Stars</Text>
                <Text style={styles.tipsDesc}>Top-rated travelers get priority access to long-haul, high-payout international routes.</Text>
              </View>
              <TouchableOpacity style={styles.readGuideBtn}>
                <Text style={styles.readGuideText}>Read Guide</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 130 }} /> 
          </View>

        </ScrollView>
      </View>

      {/* Top Floating Header */}
      <SafeAreaView edges={['top']} style={styles.absoluteHeader}>
        <View style={styles.headerContent}>
            <View style={styles.userInfoRow}>
              <View style={styles.profilePicBorder}>
                <View style={{width: '100%', height: '100%', backgroundColor: '#D1EFE0', borderRadius: 20}} />
              </View>
              <Text style={styles.floatingHeaderName}>The Quiet Velocity</Text>
            </View>
            <TouchableOpacity style={styles.bellIconBox}>
              <Svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                <Path d="M8 25V23H10V16C10 14.6167 10.4167 13.3875 11.25 12.3125C12.0833 11.2375 13.1667 10.5333 14.5 10.2V9.5C14.5 9.08333 14.6458 8.72917 14.9375 8.4375C15.2292 8.14583 15.5833 8 16 8C16.4167 8 16.7708 8.14583 17.0625 8.4375C17.3542 8.72917 17.5 9.08333 17.5 9.5V10.2C18.8333 10.5333 19.9167 11.2375 20.75 12.3125C21.5833 13.3875 22 14.6167 22 16V23H24V25H8ZM16 28C15.45 28 14.9792 27.8042 14.5875 27.4125C14.1958 27.0208 14 26.55 14 26H18C18 26.55 17.8042 27.0208 17.4125 27.4125C17.0208 27.8042 16.55 28 16 28ZM12 23H20V16C20 14.9 19.6083 13.9583 18.825 13.175C18.0417 12.3917 17.1 12 16 12C14.9 12 13.9583 12.3917 13.175 13.175C12.3917 13.9583 12 14.9 12 16V23Z" fill="#064E3B"/>
              </Svg>
            </TouchableOpacity>
          </View>
      </SafeAreaView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollWrapper: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    gap: 32,
  },
  /* HEADER */
  absoluteHeader: {
    position: 'absolute',
    top: 0,
    width: '100%',
    backgroundColor: 'rgba(236, 253, 245, 0.5)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profilePicBorder: {
    width: 38,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#9DF4D2',
    overflow: 'hidden',
  },
  floatingHeaderName: {
    color: '#022C22',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
    letterSpacing: -0.5,
  },
  bellIconBox: {
    width: 45,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingContainer: {
    gap: 4,
  },
  greetingSubtitle: {
    color: '#3F4944',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Medium',
  },
  greetingTitle: {
    color: '#00513D',
    fontSize: 28,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
    letterSpacing: -0.8,
  },
  /* REVIEW CARD */
  reviewCard: {
    backgroundColor: '#006C52',
    borderRadius: 32,
    padding: 24,
    gap: 12,
    overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.10)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  reviewCardBgCircle: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(157, 244, 210, 0.1)',
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C5E7D7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
  },
  reviewBadgeText: {
    color: '#4A695C',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
    letterSpacing: 1,
  },
  reviewTitle: {
    color: '#94EAC9',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
    marginTop: 6,
  },
  reviewBody: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  reviewProgressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginTop: 8,
  },
  reviewProgressBarFill: {
    height: '100%',
    backgroundColor: '#9DF4D2',
    borderRadius: 2,
  },
  /* PROFILE CARD */
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    gap: 16,
    shadowColor: 'rgba(5, 32, 23, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  profileTitle: {
    color: '#052017',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  profilePercent: {
    color: '#00513D',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  progressBarTrack: {
    width: '100%',
    height: 12,
    backgroundColor: '#CBE9DA',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00513D',
    borderRadius: 6,
  },
  profileHintText: {
    color: '#3F4944',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Regular',
  },
  /* LOCKED SERVICES */
  lockedServicesContainer: {
    gap: 16,
  },
  lockedServiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFBEB',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(157, 244, 210, 0.1)',
  },
  lockedIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedServiceContent: {
    flex: 1,
    marginLeft: 16,
    marginRight: 12,
    gap: 4,
  },
  lockedServiceTitle: {
    color: '#052017',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  lockedServiceDesc: {
    color: '#3F4944',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Regular',
    lineHeight: 18,
  },
  lockedBadgeContainer: {
    alignItems: 'center',
    opacity: 0.6,
    gap: 4,
  },
  lockedText: {
    color: '#052017',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
    letterSpacing: -0.5,
  },
  /* TIPS FOR TRAVELERS */
  tipsSection: {
    gap: 16,
  },
  tipsHeader: {
    color: '#00513D',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
    paddingHorizontal: 4,
  },
  tipsCardImage: {
    backgroundColor: '#D7F5E5',
    borderRadius: 24,
    overflow: 'hidden',
  },
  tipsImgContainer: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(0, 108, 82, 0.1)',
  },
  tipsTextContent: {
    padding: 20,
    gap: 8,
  },
  tipsTitle: {
    color: '#052017',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  tipsDesc: {
    color: '#3F4944',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Regular',
  },
  tipsCardStandard: {
    backgroundColor: '#CBE9DA',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  tipsIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 81, 61, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  readGuideBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
    marginLeft: 16,
  },
  readGuideText: {
    color: '#00513D',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },

});

export default TravelerHomeScreen;
