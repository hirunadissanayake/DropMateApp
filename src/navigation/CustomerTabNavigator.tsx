import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import CustomerHomeScreen from '../screens/CustomerHomeScreen';
import ShipmentsScreen from '../screens/ShipmentsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FindTripsScreen from '../screens/FindTripsScreen';
import CustomerTabBar from '../components/navigation/CustomerTabBar';

import { StatusBar } from 'react-native';

import { useAuthStore } from '../store/authStore';

const Tab = createBottomTabNavigator();

const CustomerTabNavigator = () => {
  const { user } = useAuthStore();
  const isApproved = user?.isCustomerApproved === true;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <Tab.Navigator
        tabBar={(props) => <CustomerTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen name="Home" component={CustomerHomeScreen} />
        {isApproved && (
          <>
            <Tab.Screen name="Find Travelers" component={FindTripsScreen} />
            <Tab.Screen name="Shipments" component={ShipmentsScreen} />
          </>
        )}
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </>
  );
};

export default CustomerTabNavigator;
