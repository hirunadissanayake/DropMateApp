import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'react-native';

import TravelerHomeScreen from '../screens/TravelerHomeScreen';
import TravelerTripsScreen from '../screens/TravelerTripsScreen';
import FindParcelsScreen from '../screens/FindParcelsScreen';
import TravelerProfileScreen from '../screens/TravelerProfileScreen';
import RequestsScreen from '../screens/RequestsScreen';
import CustomerTabBar from '../components/navigation/CustomerTabBar';
import { useAuthStore } from '../store/authStore';

const Tab = createBottomTabNavigator();

const TravelerTabNavigator = () => {
  const { user } = useAuthStore();
  const isApproved = user?.isTravelerApproved === true;

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
        {isApproved && (
          <>
            <Tab.Screen name="My Trips" component={TravelerTripsScreen} />
            <Tab.Screen name="Requests" component={RequestsScreen} />
          </>
        )}
        <Tab.Screen name="Profile" component={TravelerProfileScreen} />
      </Tab.Navigator>
    </>
  );
};

export default TravelerTabNavigator;
