import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import SignupScreen from '../screens/SignupScreen';
import VerificationScreen from '../screens/VerificationScreen';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  RoleSelection: undefined;
  Signup: { role: 'CUSTOMER' | 'TRAVELER' };
  Verification: { role: 'CUSTOMER' | 'TRAVELER' };
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};
