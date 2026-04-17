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
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Rect, G, Defs, Filter, FeFlood, FeColorMatrix, FeOffset, FeGaussianBlur, FeComposite, FeBlend } from 'react-native-svg';

const { width } = Dimensions.get('window');

const CustomerHomeScreen = ({ navigation }: any) => {
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

          {/* Under Review Card */}
          <View style={styles.reviewCard}>
            <View style={styles.reviewCardBgCircle} />
            <View style={styles.reviewHeaderRow}>
              <View style={styles.reviewHeaderTextCol}>
                <View style={styles.reviewBadge}>
                  <Text style={styles.reviewBadgeText}>UNDER REVIEW</Text>
                </View>
                <Text style={styles.reviewTitle}>Verification in Progress</Text>
              </View>
              <Svg width="20" height="25" viewBox="0 0 20 25" fill="none">
                <Path d="M8.6875 16.9375L15.75 9.875L13.9688 8.09375L8.6875 13.375L6.0625 10.75L4.28125 12.5312L8.6875 16.9375ZM10 25C7.10417 24.2708 4.71354 22.6094 2.82812 20.0156C0.942708 17.4219 0 14.5417 0 11.375V3.75L10 0L20 3.75V11.375C20 14.5417 19.0573 17.4219 17.1719 20.0156C15.2865 22.6094 12.8958 24.2708 10 25Z" fill="#00513D"/>
              </Svg>
            </View>
            <Text style={styles.reviewBody}>
              We're currently reviewing your identity documents. This usually takes 24-48 hours. You'll have full access to shipping soon.
            </Text>
          </View>

          {/* Complete your profile */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeaderRow}>
              <Text style={styles.profileTitle}>Complete your profile</Text>
              <Text style={styles.profilePercent}>80%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '80%' }]} />
            </View>
            <View style={styles.profileHintRow}>
              <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <Path d="M5.25 8.75H6.41667V5.25H5.25V8.75ZM5.83333 4.08333C5.99861 4.08333 6.13715 4.02743 6.24896 3.91563C6.36076 3.80382 6.41667 3.66528 6.41667 3.5C6.41667 3.33472 6.36076 3.19618 6.24896 3.08437C6.13715 2.97257 5.99861 2.91667 5.83333 2.91667C5.66806 2.91667 5.52951 2.97257 5.41771 3.08437C5.3059 3.19618 5.25 3.33472 5.25 3.5C5.25 3.66528 5.3059 3.80382 5.41771 3.91563C5.52951 4.02743 5.66806 4.08333 5.83333 4.08333ZM5.83333 11.6667C5.02639 11.6667 4.26806 11.5135 3.55833 11.2073C2.84861 10.901 2.23125 10.4854 1.70625 9.96042C1.18125 9.43542 0.765625 8.81806 0.459375 8.10833C0.153125 7.39861 0 6.64028 0 5.83333C0 5.02639 0.153125 4.26806 0.459375 3.55833C0.765625 2.84861 1.18125 2.23125 1.70625 1.70625C2.23125 1.18125 2.84861 0.765625 3.55833 0.459375C4.26806 0.153125 5.02639 0 5.83333 0C6.64028 0 7.39861 0.153125 8.10833 0.459375C8.81806 0.765625 9.43542 1.18125 9.96042 1.70625C10.4854 2.23125 10.901 2.84861 11.2073 3.55833C11.5135 4.26806 11.6667 5.02639 11.6667 5.83333C11.6667 6.64028 11.5135 7.39861 11.2073 8.10833C10.901 8.81806 10.4854 9.43542 9.96042 9.96042C9.43542 10.4854 8.81806 10.901 8.10833 11.2073C7.39861 11.5135 6.64028 11.6667 5.83333 11.6667ZM5.83333 10.5C7.13611 10.5 8.23958 10.0479 9.14375 9.14375C10.0479 8.23958 10.5 7.13611 10.5 5.83333C10.5 4.53056 10.0479 3.42708 9.14375 2.52292C8.23958 1.61875 7.13611 1.16667 5.83333 1.16667C4.53056 1.16667 3.42708 1.61875 2.52292 2.52292C1.61875 3.42708 1.16667 4.53056 1.16667 5.83333C1.16667 7.13611 1.61875 8.23958 2.52292 9.14375C3.42708 10.0479 4.53056 10.5 5.83333 10.5Z" fill="#3F4944"/>
              </Svg>
              <Text style={styles.profileHintText}>Just add a backup contact to hit 100%</Text>
            </View>
          </View>

          {/* Services */}
          <View style={styles.servicesSection}>
            <Text style={styles.sectionHeader}>SERVICES</Text>
            <View style={styles.servicesRow}>
              
              <TouchableOpacity activeOpacity={0.8} style={styles.serviceItem}>
                <View style={styles.serviceIconContainer}>
                  <Svg width="28" height="20" viewBox="0 0 28 20" fill="none">
                    <Path d="M6.25 20C5.20833 20 4.32292 19.6354 3.59375 18.9062C2.86458 18.1771 2.5 17.2917 2.5 16.25H0V2.5C0 1.8125 0.244792 1.22396 0.734375 0.734375C1.22396 0.244792 1.8125 0 2.5 0H20V5H23.75L27.5 10V16.25H25C25 17.2917 24.6354 18.1771 23.9062 18.9062C23.1771 19.6354 22.2917 20 21.25 20C20.2083 20 19.3229 19.6354 18.5938 18.9062C17.8646 18.1771 17.5 17.2917 17.5 16.25H10C10 17.2917 9.63542 18.1771 8.90625 18.9062C8.17708 19.6354 7.29167 20 6.25 20ZM6.25 17.5C6.60417 17.5 6.90104 17.3802 7.14062 17.1406C7.38021 16.901 7.5 16.6042 7.5 16.25C7.5 15.8958 7.38021 15.599 7.14062 15.3594C6.90104 15.1198 6.60417 15 6.25 15C5.89583 15 5.59896 15.1198 5.35938 15.3594C5.11979 15.599 5 15.8958 5 16.25C5 16.6042 5.11979 16.901 5.35938 17.1406C5.59896 17.3802 5.89583 17.5 6.25 17.5ZM2.5 13.75H3.5C3.85417 13.375 4.26042 13.0729 4.71875 12.8438C5.17708 12.6146 5.6875 12.5 6.25 12.5C6.8125 12.5 7.32292 12.6146 7.78125 12.8438C8.23958 13.0729 8.64583 13.375 9 13.75H17.5V2.5H2.5V13.75ZM21.25 17.5C21.6042 17.5 21.901 17.3802 22.1406 17.1406C22.3802 16.901 22.5 16.6042 22.5 16.25C22.5 15.8958 22.3802 15.599 22.1406 15.3594C21.901 15.1198 21.6042 15 21.25 15C20.8958 15 20.599 15.1198 20.3594 15.3594C20.1198 15.599 20 15.8958 20 16.25C20 16.6042 20.1198 16.901 20.3594 17.1406C20.599 17.3802 20.8958 17.5 21.25 17.5ZM20 11.25H25.3125L22.5 7.5H20V11.25Z" fill="#052017"/>
                  </Svg>
                  <View style={styles.floatingAddBtn}>
                     <Svg width="12" height="12" viewBox="0 0 16 16" fill="none"><Path d="M7 15.5V9.5H1V7.5H7V1.5H9V7.5H15V9.5H9V15.5H7Z" fill="#763229"/></Svg>
                  </View>
                </View>
                <Text style={styles.serviceText}>Send Parcel</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.8} style={styles.serviceItem}>
                <View style={styles.serviceIconContainer}>
                  <Svg width="20" height="25" viewBox="0 0 20 25" fill="none">
                    <Path d="M10 12.5C10.6875 12.5 11.276 12.2552 11.7656 11.7656C12.2552 11.276 12.5 10.6875 12.5 10C12.5 9.3125 12.2552 8.72396 11.7656 8.23438C11.276 7.74479 10.6875 7.5 10 7.5C9.3125 7.5 8.72396 7.74479 8.23438 8.23438C7.74479 8.72396 7.5 9.3125 7.5 10C7.5 10.6875 7.74479 11.276 8.23438 11.7656C8.72396 12.2552 9.3125 12.5 10 12.5ZM10 21.6875C12.5417 19.3542 14.4271 17.2344 15.6562 15.3281C16.8854 13.4219 17.5 11.7292 17.5 10.25C17.5 7.97917 16.776 6.11979 15.3281 4.67188C13.8802 3.22396 12.1042 2.5 10 2.5C7.89583 2.5 6.11979 3.22396 4.67188 4.67188C3.22396 6.11979 2.5 7.97917 2.5 10.25C2.5 11.7292 3.11458 13.4219 4.34375 15.3281C5.57292 17.2344 7.45833 19.3542 10 21.6875ZM10 25C6.64583 22.1458 4.14062 19.4948 2.48438 17.0469C0.828125 14.599 0 12.3333 0 10.25C0 7.125 1.00521 4.63542 3.01562 2.78125C5.02604 0.927083 7.35417 0 10 0C12.6458 0 14.974 0.927083 16.9844 2.78125C18.9948 4.63542 20 7.125 20 10.25C20 12.3333 19.1719 14.599 17.5156 17.0469C15.8594 19.4948 13.3542 22.1458 10 25Z" fill="#052017"/>
                  </Svg>
                  <View style={styles.floatingAddBtn}>
                    <Svg width="12" height="12" viewBox="0 0 16 16" fill="none"><Path d="M7 15.5V9.5H1V7.5H7V1.5H9V7.5H15V9.5H9V15.5H7Z" fill="#763229"/></Svg>
                  </View>
                </View>
                <Text style={styles.serviceText}>Track</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.8} style={styles.serviceItem}>
                <View style={styles.serviceIconContainer}>
                  <Svg width="24" height="23" viewBox="0 0 24 23" fill="none">
                    <Path d="M2.5 20V2.5C2.5 2.5 2.5 2.96354 2.5 3.89062C2.5 4.81771 2.5 6.02083 2.5 7.5V15C2.5 16.4792 2.5 17.6823 2.5 18.6094C2.5 19.5365 2.5 20 2.5 20ZM2.5 22.5C1.8125 22.5 1.22396 22.2552 0.734375 21.7656C0.244792 21.276 0 20.6875 0 20V2.5C0 1.8125 0.244792 1.22396 0.734375 0.734375C1.22396 0.244792 1.8125 0 2.5 0H20C20.6875 0 21.276 0.244792 21.7656 0.734375C22.2552 1.22396 22.5 1.8125 22.5 2.5V5.625H20V2.5H2.5V20H20V16.875H22.5V20C22.5 20.6875 22.2552 21.276 21.7656 21.7656C21.276 22.2552 20.6875 22.5 20 22.5H2.5ZM12.5 17.5C11.8125 17.5 11.224 17.2552 10.7344 16.7656C10.2448 16.276 10 15.6875 10 15V7.5C10 6.8125 10.2448 6.22396 10.7344 5.73438C11.224 5.24479 11.8125 5 12.5 5H21.25C21.9375 5 22.526 5.24479 23.0156 5.73438C23.5052 6.22396 23.75 6.8125 23.75 7.5V15C23.75 15.6875 23.5052 16.276 23.0156 16.7656C22.526 17.2552 21.9375 17.5 21.25 17.5H12.5ZM21.25 15V7.5H12.5V15H21.25ZM16.25 13.125C16.7708 13.125 17.2135 12.9427 17.5781 12.5781C17.9427 12.2135 18.125 11.7708 18.125 11.25C18.125 10.7292 17.9427 10.2865 17.5781 9.92188C17.2135 9.55729 16.7708 9.375 16.25 9.375C15.7292 9.375 15.2865 9.55729 14.9219 9.92188C14.5573 10.2865 14.375 10.7292 14.375 11.25C14.375 11.7708 14.5573 12.2135 14.9219 12.5781C15.2865 12.9427 15.7292 13.125 16.25 13.125Z" fill="#052017"/>
                  </Svg>
                  <View style={styles.floatingAddBtn}>
                     <Svg width="12" height="12" viewBox="0 0 16 16" fill="none"><Path d="M7 15.5V9.5H1V7.5H7V1.5H9V7.5H15V9.5H9V15.5H7Z" fill="#763229"/></Svg>
                  </View>
                </View>
                <Text style={styles.serviceText}>Wallet</Text>
              </TouchableOpacity>

            </View>
          </View>

          {/* Explore */}
          <View style={styles.exploreSection}>
            <Text style={styles.sectionHeader}>EXPLORE DROPMATE</Text>
            
            <View style={styles.exploreCardGreen}>
              <View style={styles.exploreCardTextCol}>
                <Text style={styles.exploreCardTitle}>How it works</Text>
                <Text style={styles.exploreCardDesc}>Master the art of seamless delivery in 3 steps.</Text>
              </View>
              <View style={styles.exploreImgContainer}>
                <View style={{width: '100%', height: '100%', backgroundColor: 'rgba(0,108,82,0.1)'}} />
              </View>
            </View>

            <View style={styles.exploreCardLightGreen}>
              <View style={styles.exploreCardTextCol}>
                <Text style={styles.exploreCardTitle}>Safety & Trust</Text>
                <Text style={styles.exploreCardDesc}>Your packages are insured and handled with care.</Text>
              </View>
              <View style={styles.exploreImgContainer}>
                <View style={{width: '100%', height: '100%', backgroundColor: 'rgba(0,108,82,0.1)'}} />
              </View>
            </View>

            <View style={{ height: 130 }} /> 
          </View>

        </ScrollView>
      </View>

      {/* Top Floating Header */}
      <View style={styles.absoluteHeader}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.userInfoRow}>
              <View style={styles.profilePicBorder}>
                <View style={{width: '100%', height: '100%', backgroundColor: '#D1EFE0', borderRadius: 20}} />
              </View>
              <Text style={styles.greetingTitle}>Good Morning, Elena</Text>
            </View>
            <TouchableOpacity style={styles.bellIconBox}>
              <Svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                <Path d="M0 17V15H2V8C2 6.61667 2.41667 5.3875 3.25 4.3125C4.08333 3.2375 5.16667 2.53333 6.5 2.2V1.5C6.5 1.08333 6.64583 0.729167 6.9375 0.4375C7.22917 0.145833 7.58333 0 8 0C8.41667 0 8.77083 0.145833 9.0625 0.4375C9.35417 0.729167 9.5 1.08333 9.5 1.5V2.2C10.8333 2.53333 11.9167 3.2375 12.75 4.3125C13.5833 5.3875 14 6.61667 14 8V15H16V17H0ZM8 20C7.45 20 6.97917 19.8042 6.5875 19.4125C6.19583 19.0208 6 18.55 6 18H10C10 18.55 9.80417 19.0208 9.4125 19.4125C9.02083 19.8042 8.55 20 8 20ZM4 15H12V8C12 6.9 11.6083 5.95833 10.825 5.175C10.0417 4.39167 9.1 4 8 4C6.9 4 5.95833 4.39167 5.175 5.175C4.39167 5.95833 4 6.9 4 8V15Z" fill="#064E3B"/>
              </Svg>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Bottom Nav */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNavInner}>
          
          <TouchableOpacity style={styles.navItem}>
            <View style={styles.navItemActiveBg}>
              <Svg width="16" height="18" viewBox="0 0 16 18" fill="none"><Path d="M0 17.1V5.7L7.6 0L15.2 5.7V17.1H9.5V10.45H5.7V17.1H0Z" fill="#064E3B"/></Svg>
              <Text style={styles.navItemActiveText}>HOME</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <View style={styles.navItemInactiveBg}>
               <Svg width="18" height="19" viewBox="0 0 18 19" fill="none"><Path d="M7.6 16.5537V10.0462L1.9 6.745V13.2525L7.6 16.5537ZM9.5 16.5537L15.2 13.2525V6.745L9.5 10.0462V16.5537ZM7.6 18.7388L0.95 14.915C0.649167 14.7408 0.415625 14.5113 0.249375 14.2263C0.083125 13.9413 0 13.6246 0 13.2763V5.72375C0 5.37542 0.083125 5.05875 0.249375 4.77375C0.415625 4.48875 0.649167 4.25917 0.95 4.085L7.6 0.26125C7.90083 0.0870833 8.2175 0 8.55 0C8.8825 0 9.19917 0.0870833 9.5 0.26125L16.15 4.085C16.4508 4.25917 16.6844 4.48875 16.8506 4.77375C17.0169 5.05875 17.1 5.37542 17.1 5.72375V13.2763C17.1 13.6246 17.0169 13.9413 16.8506 14.2263C16.6844 14.5113 16.4508 14.7408 16.15 14.915L9.5 18.7388C9.19917 18.9129 8.8825 19 8.55 19C8.2175 19 7.90083 18.9129 7.6 18.7388ZM12.35 6.19875L14.1788 5.15375L8.55 1.9L6.6975 2.96875L12.35 6.19875ZM8.55 8.4075L10.4025 7.33875L4.77375 4.085L2.92125 5.15375L8.55 8.4075Z" fill="#064E3B" fillOpacity="0.4"/></Svg>
              <Text style={styles.navItemInactiveText}>SHIPMENTS</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
             <View style={styles.navItemInactiveBg}>
               <Svg width="19" height="18" viewBox="0 0 19 18" fill="none"><Path d="M1.9 15.2V1.9C1.9 1.9 1.9 2.25229 1.9 2.95687C1.9 3.66146 1.9 4.57583 1.9 5.7V11.4C1.9 12.5242 1.9 13.4385 1.9 14.1431C1.9 14.8477 1.9 15.2 1.9 15.2ZM1.9 17.1C1.3775 17.1 0.930208 16.914 0.558125 16.5419C0.186042 16.1698 0 15.7225 0 15.2V1.9C0 1.3775 0.186042 0.930208 0.558125 0.558125C0.930208 0.186042 1.3775 0 1.9 0H15.2C15.7225 0 16.1698 0.186042 16.5419 0.558125C16.914 0.930208 17.1 1.3775 17.1 1.9V4.275H15.2V1.9H1.9V15.2H15.2V12.825H17.1V15.2C17.1 15.7225 16.914 16.1698 16.5419 16.5419C16.1698 16.914 15.7225 17.1 15.2 17.1H1.9ZM9.5 13.3C8.9775 13.3 8.53021 13.114 8.15812 12.7419C7.78604 12.3698 7.6 11.9225 7.6 11.4V5.7C7.6 5.1775 7.78604 4.73021 8.15812 4.35813C8.53021 3.98604 8.9775 3.8 9.5 3.8H16.15C16.6725 3.8 17.1198 3.98604 17.4919 4.35813C17.864 4.73021 18.05 5.1775 18.05 5.7V11.4C18.05 11.9225 17.864 12.3698 17.4919 12.7419C17.1198 13.114 16.6725 13.3 16.15 13.3H9.5ZM16.15 11.4V5.7H9.5V11.4H16.15ZM12.35 9.975C12.7458 9.975 13.0823 9.83646 13.3594 9.55937C13.6365 9.28229 13.775 8.94583 13.775 8.55C13.775 8.15417 13.6365 7.81771 13.3594 7.54062C13.0823 7.26354 12.7458 7.125 12.35 7.125C11.9542 7.125 11.6177 7.26354 11.3406 7.54062C11.0635 7.81771 10.925 8.15417 10.925 8.55C10.925 8.94583 11.0635 9.28229 11.3406 9.55937C11.6177 9.83646 11.9542 9.975 12.35 9.975Z" fill="#064E3B" fillOpacity="0.4"/></Svg>
               <Text style={styles.navItemInactiveText}>WALLET</Text>
             </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
             <View style={styles.navItemInactiveBg}>
               <Svg width="16" height="16" viewBox="0 0 16 16" fill="none"><Path d="M7.6 7.6C6.555 7.6 5.66042 7.22792 4.91625 6.48375C4.17208 5.73958 3.8 4.845 3.8 3.8C3.8 2.755 4.17208 1.86042 4.91625 1.11625C5.66042 0.372083 6.555 0 7.6 0C8.645 0 9.53958 0.372083 10.2837 1.11625C11.0279 1.86042 11.4 2.755 11.4 3.8C11.4 4.845 11.0279 5.73958 10.2837 6.48375C9.53958 7.22792 8.645 7.6 7.6 7.6ZM0 15.2V12.54C0 12.0017 0.138542 11.5069 0.415625 11.0556C0.692708 10.6044 1.06083 10.26 1.52 10.0225C2.50167 9.53167 3.49917 9.16354 4.5125 8.91812C5.52583 8.67271 6.555 8.55 7.6 8.55C8.645 8.55 9.67417 8.67271 10.6875 8.91812C11.7008 9.16354 12.6983 9.53167 13.68 10.0225C14.1392 10.26 14.5073 10.6044 14.7844 11.0556C15.0615 11.5069 15.2 12.0017 15.2 12.54V15.2H0ZM1.9 13.3H13.3V12.54C13.3 12.3658 13.2565 12.2075 13.1694 12.065C13.0823 11.9225 12.9675 11.8117 12.825 11.7325C11.97 11.305 11.1071 10.9844 10.2362 10.7706C9.36542 10.5569 8.48667 10.45 7.6 10.45C6.71333 10.45 5.83458 10.5569 4.96375 10.7706C4.09292 10.9844 3.23 11.305 2.375 11.7325C2.2325 11.8117 2.11771 11.9225 2.03063 12.065C1.94354 12.2075 1.9 12.3658 1.9 12.54V13.3ZM7.6 5.7C8.1225 5.7 8.56979 5.51396 8.94188 5.14187C9.31396 4.76979 9.5 4.3225 9.5 3.8C9.5 3.2775 9.31396 2.83021 8.94188 2.45813C8.56979 2.08604 8.1225 1.9 7.6 1.9C7.0775 1.9 6.63021 2.08604 6.25813 2.45813C5.88604 2.83021 5.7 3.2775 5.7 3.8C5.7 4.3225 5.88604 4.76979 6.25813 5.14187C6.63021 5.51396 7.0775 5.7 7.6 5.7Z" fill="#064E3B" fillOpacity="0.4"/></Svg>
               <Text style={styles.navItemInactiveText}>PROFILE</Text>
             </View>
          </TouchableOpacity>
        </View>
      </View>
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
    borderColor: 'rgba(0, 108, 82, 0.20)',
    overflow: 'hidden',
  },
  greetingTitle: {
    color: '#064E3B',
    fontSize: 28,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-SemiBold',
    letterSpacing: -0.5,
  },
  bellIconBox: {
    width: 45,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* REVIEW CARD */
  reviewCard: {
    backgroundColor: '#DCFBEB',
    borderRadius: 12,
    padding: 24,
    gap: 16,
    overflow: 'hidden',
  },
  reviewCardBgCircle: {
    position: 'absolute',
    right: -16,
    bottom: -16,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0, 81, 61, 0.05)',
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewHeaderTextCol: {
    gap: 4,
  },
  reviewBadge: {
    backgroundColor: '#006C52',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  reviewBadgeText: {
    color: '#94EAC9',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
    letterSpacing: 1,
  },
  reviewTitle: {
    color: '#052017',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
    marginTop: 8,
  },
  reviewBody: {
    color: '#3F4944',
    fontSize: 16,
    lineHeight: 26,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Regular',
  },
  /* PROFILE CARD */
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    gap: 16,
    shadowColor: 'rgba(5, 32, 23, 0.04)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 32,
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
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  profilePercent: {
    color: '#00513D',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  progressBarTrack: {
    width: '100%',
    height: 12,
    backgroundColor: '#D7F5E5',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00513D',
    borderRadius: 6,
  },
  profileHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileHintText: {
    color: '#3F4944',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Regular',
  },
  /* SERVICES */
  servicesSection: {
    gap: 16,
  },
  sectionHeader: {
    color: '#3F4944',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-SemiBold',
  },
  servicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  serviceItem: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  serviceIconContainer: {
    width: '90%',
    aspectRatio: 1.2,
    backgroundColor: '#D7F5E5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingAddBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceText: {
    color: '#052017',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-SemiBold',
  },
  /* EXPLORE DROPMATE */
  exploreSection: {
    gap: 16,
  },
  exploreCardGreen: {
    flexDirection: 'row',
    backgroundColor: '#D1EFE0',
    borderRadius: 12,
    height: 128,
    overflow: 'hidden',
  },
  exploreCardLightGreen: {
    flexDirection: 'row',
    backgroundColor: '#C5E7D7',
    borderRadius: 12,
    height: 128,
    overflow: 'hidden',
  },
  exploreCardTextCol: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  exploreCardTitle: {
    color: '#052017',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
    marginBottom: 4,
  },
  exploreCardDesc: {
    color: '#4A695C',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Regular',
  },
  exploreImgContainer: {
    width: 128,
    backgroundColor: 'rgba(0, 81, 61, 0.1)',
  },
  /* BOTTOM NAV */
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderColor: 'rgba(6, 78, 59, 0.05)',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 11,
    shadowColor: 'rgba(5, 32, 23, 0.04)',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 10,
  },
  bottomNavInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 61,
  },
  navItemActiveBg: {
    backgroundColor: 'rgba(209, 250, 229, 0.8)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  navItemInactiveBg: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  navItemActiveText: {
    color: '#064E3B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-SemiBold',
  },
  navItemInactiveText: {
    color: 'rgba(6, 78, 59, 0.40)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-SemiBold',
  },
});

export default CustomerHomeScreen;
