import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { SplashScreen } from '../screens/SplashScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { CropSelectScreen } from '../screens/CropSelectScreen';
import { CameraCaptureScreen } from '../screens/CameraCaptureScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { NearbyHelpScreen } from '../screens/NearbyHelpScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Colors } from '../theme';
import { useI18n } from '../services/i18n';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ focused }) => {
          let icon = '🏠';
          if (route.name === 'Home') icon = '🌱';
          else if (route.name === 'My Cases') icon = '📋';
          else if (route.name === 'Nearby Help') icon = '📞';
          else if (route.name === 'Settings') icon = '⚙️';
          return <Text style={{ fontSize: 20 }}>{icon}</Text>;
        },
      })}
    >
      <Tab.Screen name='Home' component={HomeScreen} />
      <Tab.Screen name='My Cases' component={HistoryScreen} />
      <Tab.Screen name='Nearby Help' component={NearbyHelpScreen} />
      <Tab.Screen name='Settings' component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const [splashFinished, setSplashFinished] = useState(false);

  if (!splashFinished) {
    return <SplashScreen onFinish={() => setSplashFinished(true)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name='MainTabs' component={MainTabs} />
        <Stack.Screen name='CropSelect' component={CropSelectScreen} />
        <Stack.Screen name='CameraCapture' component={CameraCaptureScreen} />
        <Stack.Screen name='Result' component={ResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};