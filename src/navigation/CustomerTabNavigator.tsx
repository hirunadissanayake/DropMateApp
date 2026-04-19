import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import CustomerHomeScreen from '../screens/CustomerHomeScreen';
import ShipmentsScreen from '../screens/ShipmentsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RequestsScreen from '../screens/RequestsScreen';
import CustomerTabBar from '../components/navigation/CustomerTabBar';

import { StatusBar } from 'react-native';

const Tab = createBottomTabNavigator();

const CustomerTabNavigator = () => {
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
        <Tab.Screen name="Shipments" component={ShipmentsScreen} />
        <Tab.Screen name="Requests" component={RequestsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </>
  );
};

export default CustomerTabNavigator;
