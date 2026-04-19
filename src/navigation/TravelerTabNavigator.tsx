import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'react-native';

import TravelerHomeScreen from '../screens/TravelerHomeScreen';
import TravelerTripsScreen from '../screens/TravelerTripsScreen';
import FindParcelsScreen from '../screens/FindParcelsScreen';
import TravelerProfileScreen from '../screens/TravelerProfileScreen';
import RequestsScreen from '../screens/RequestsScreen';
import CustomerTabBar from '../components/navigation/CustomerTabBar';

const Tab = createBottomTabNavigator();

const TravelerTabNavigator = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <Tab.Navigator
        tabBar={(props) => <CustomerTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen name="Home" component={TravelerHomeScreen} />
        <Tab.Screen name="My Trips" component={TravelerTripsScreen} />
        <Tab.Screen name="Requests" component={RequestsScreen} />
        <Tab.Screen name="Find Parcels" component={FindParcelsScreen} />
        <Tab.Screen name="Profile" component={TravelerProfileScreen} />
      </Tab.Navigator>
    </>
  );
};

export default TravelerTabNavigator;
