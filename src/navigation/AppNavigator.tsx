import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { requestUserPermission, getFcmToken, setupFcmListeners } from '../services/fcmService';
import '@react-native-firebase/app';
import { getMessaging, onTokenRefresh } from '@react-native-firebase/messaging';



import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import SignupScreen from '../screens/SignupScreen';
import VerificationScreen from '../screens/VerificationScreen';
import BlockedScreen from '../screens/BlockedScreen';
import VerificationSuccessScreen from '../screens/VerificationSuccessScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyOTPScreen from '../screens/VerifyOTPScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import CustomerTabNavigator from '../navigation/CustomerTabNavigator';
import TravelerTabNavigator from '../navigation/TravelerTabNavigator';
import TravelerHomeScreen from '../screens/TravelerHomeScreen';
import PersonalDetailsScreen from '../screens/PersonalDetailsScreen';
import VehicleDetailsScreen from '../screens/VehicleDetailsScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import RequestRoleScreen from '../screens/RequestRoleScreen';
import CreateParcelScreen from '../screens/CreateParcelScreen';
import ParcelDetailsScreen from '../screens/ParcelDetailsScreen';
import CreateTripScreen from '../screens/CreateTripScreen';
import TripDetailsScreen from '../screens/TripDetailsScreen';
import RequestsScreen from '../screens/RequestsScreen';
import PaymentScreen from '../screens/PaymentScreen';
import TravelerEarningsScreen from '../screens/TravelerEarningsScreen';
import WalletScreen from '../screens/WalletScreen';
import BankDetailsScreen from '../screens/BankDetailsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import SupportChatScreen from '../screens/SupportChatScreen';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  RoleSelection: undefined;
  Signup: { role: 'CUSTOMER' | 'TRAVELER' };
  Verification: { role: 'CUSTOMER' | 'TRAVELER' };
  VerificationSuccess: undefined;
  ForgotPassword: undefined;
  VerifyOTP: { phoneNumber: string, flow?: string };
  ResetPassword: undefined;
  CustomerHome: undefined;
  TravelerHome: undefined;
  PersonalDetails: undefined;
  VehicleDetails: undefined;
  ChangePassword: undefined;
  RequestRole: undefined;
  CreateParcel: undefined;
  ParcelDetails: { parcelId: string };
  TripDetails: { tripId: string };
  CreateTrip: undefined;
  FindParcels: undefined;
  Requests: undefined;
  Payment: { parcelId: string, amount: number };
  TravelerEarnings: undefined;
  Wallet: undefined;
  BankDetails: undefined;
  Notifications: undefined;
  Announcements: undefined;
  HelpCenter: undefined;
  SupportChat: undefined;
  Blocked: undefined;
};



import { navigationRef } from './navigationRef';
import { socketService } from '../services/socketService';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (token && user?.id) {
      socketService.connect(user.id);
    }
  }, [token, user?.id]);

  useEffect(() => {
    const setupFCM = async () => {
      const hasPermission = await requestUserPermission();
      if (hasPermission && token) {
        await getFcmToken(token);
      }
    };

    setupFCM();
    
    // Setup Listeners
    const unsubscribeOnMessage = setupFcmListeners();

    // Listen to token refresh
    const unsubscribeTokenRefresh = onTokenRefresh(getMessaging(), async fcmToken => {
        if (token) {
            console.log('FCM Token Refreshed:', fcmToken);
            await getFcmToken(token);
        }
    });

    return () => {
      unsubscribeOnMessage();
      unsubscribeTokenRefresh();
    };
  }, [token]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: 'slide_from_right',
          fullScreenGestureEnabled: true,
          gestureEnabled: true,
        }} 
        initialRouteName={user?.isBlocked ? "Blocked" : "Splash"}
      >
        {user?.isBlocked ? (
          <>
            <Stack.Screen 
                name="Blocked" 
                component={BlockedScreen} 
                options={{ 
                animation: 'fade',
                gestureEnabled: false 
                }}
            />
            <Stack.Screen 
                name="SupportChat" 
                component={SupportChatScreen} 
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ animation: 'fade_from_bottom' }} 
            />
            <Stack.Screen 
              name="RoleSelection" 
              component={RoleSelectionScreen} 
            />
            <Stack.Screen 
              name="Signup" 
              component={SignupScreen} 
            />
            <Stack.Screen 
              name="Verification" 
              component={VerificationScreen} 
            />
            <Stack.Screen 
              name="VerificationSuccess" 
              component={VerificationSuccessScreen} 
            />
            <Stack.Screen 
              name="ForgotPassword" 
              component={ForgotPasswordScreen} 
            />
            <Stack.Screen 
              name="VerifyOTP" 
              component={VerifyOTPScreen} 
            />
            <Stack.Screen 
              name="ResetPassword" 
              component={ResetPasswordScreen} 
            />
            <Stack.Screen 
              name="CustomerHome" 
              component={CustomerTabNavigator} 
            />
            <Stack.Screen 
              name="TravelerHome" 
              component={TravelerTabNavigator} 
            />
            <Stack.Screen 
              name="PersonalDetails" 
              component={PersonalDetailsScreen} 
            />
            <Stack.Screen 
              name="VehicleDetails" 
              component={VehicleDetailsScreen} 
            />
            <Stack.Screen 
              name="ChangePassword" 
              component={ChangePasswordScreen} 
            />
            <Stack.Screen 
              name="RequestRole" 
              component={RequestRoleScreen} 
            />
            <Stack.Screen 
              name="CreateParcel" 
              component={CreateParcelScreen} 
            />
            <Stack.Screen 
              name="ParcelDetails" 
              component={ParcelDetailsScreen} 
            />
            <Stack.Screen 
              name="CreateTrip" 
              component={CreateTripScreen} 
            />
            <Stack.Screen 
              name="TripDetails" 
              component={TripDetailsScreen} 
            />
            <Stack.Screen 
              name="Requests" 
              component={RequestsScreen} 
            />
            <Stack.Screen 
              name="Payment" 
              component={PaymentScreen} 
            />
            <Stack.Screen 
              name="TravelerEarnings" 
              component={TravelerEarningsScreen} 
            />
            <Stack.Screen 
              name="Wallet" 
              component={WalletScreen} 
            />
            <Stack.Screen 
              name="BankDetails" 
              component={BankDetailsScreen} 
            />
            <Stack.Screen 
              name="Notifications" 
              component={NotificationsScreen} 
            />
            <Stack.Screen 
              name="Announcements" 
              component={AnnouncementsScreen} 
            />
            <Stack.Screen 
              name="HelpCenter" 
              component={HelpCenterScreen} 
            />
            <Stack.Screen 
              name="SupportChat" 
              component={SupportChatScreen} 
            />
          </>
        )}
      </Stack.Navigator>


    </NavigationContainer>
  );
};
