import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import SignupScreen from '../screens/SignupScreen';
import VerificationScreen from '../screens/VerificationScreen';
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
};


const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: 'slide_from_right',
          fullScreenGestureEnabled: true,
          gestureEnabled: true,
        }} 
        initialRouteName="Splash"
      >
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
      </Stack.Navigator>

    </NavigationContainer>
  );
};
