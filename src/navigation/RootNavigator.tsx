import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { SplashScreen } from '../screens/SplashScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { CropSelectScreen } from '../screens/CropSelectScreen';
import { CropPreparationScreen } from '../screens/CropPreparationScreen';
import { CameraCaptureScreen } from '../screens/CameraCaptureScreen';
import { AnalyzingScreen } from '../screens/AnalyzingScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { NearbyHelpScreen } from '../screens/NearbyHelpScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PesticideGuideScreen } from '../screens/PesticideGuideScreen';
import { PestExplorerScreen } from '../screens/PestExplorerScreen';
import { NutrientGuideScreen } from '../screens/NutrientGuideScreen';
import { PesticideScannerScreen } from '../screens/PesticideScannerScreen';
import { DevBuildStatusScreen } from '../screens/DevBuildStatusScreen';
import { Colors } from '../theme';
import { useI18n } from '../services/i18n';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

interface CustomTabIconProps {
  focused: boolean;
  icon: string;
  label: string;
}

const CustomTabItem: React.FC<CustomTabIconProps> = ({ focused, icon, label }) => {
  return (
    <View style={[styles.tabItemWrapper, focused && styles.tabItemFocused]}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
      {focused && <View style={styles.tabActiveBar} />}
    </View>
  );
};

const MainTabs = () => {
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabItem focused={focused} icon="🌱" label={t('home') || 'Home'} />
          ),
        }}
      />
      <Tab.Screen
        name="My Cases"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabItem focused={focused} icon="📋" label={t('myCases') || 'My Cases'} />
          ),
        }}
      />
      <Tab.Screen
        name="Nearby Help"
        component={NearbyHelpScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabItem focused={focused} icon="📞" label={t('nearbyHelp') || 'Nearby Help'} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabItem focused={focused} icon="⚙️" label={t('settings') || 'Settings'} />
          ),
        }}
      />
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
        {/* Main Tab Hub */}
        <Stack.Screen name="MainTabs" component={MainTabs} />

        {/* 1-Crop Inspection Flow */}
        <Stack.Screen name="CropSelect" component={CropSelectScreen} />
        <Stack.Screen name="CropPreparation" component={CropPreparationScreen} />
        <Stack.Screen name="CameraCapture" component={CameraCaptureScreen} />
        <Stack.Screen name="Analyzing" component={AnalyzingScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />

        {/* Crop Protection Guides */}
        <Stack.Screen name="PesticideGuide" component={PesticideGuideScreen} />
        <Stack.Screen name="PestExplorer" component={PestExplorerScreen} />
        <Stack.Screen name="NutrientGuide" component={NutrientGuideScreen} />
        <Stack.Screen name="PesticideScanner" component={PesticideScannerScreen} />

        {/* System & Reality Diagnostics */}
        <Stack.Screen name="DevBuildStatus" component={DevBuildStatusScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 72,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8EDE9',
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  tabItemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 72,
  },
  tabItemFocused: {
    backgroundColor: '#E2F4E7',
  },
  tabEmoji: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.65,
  },
  tabEmojiFocused: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78909C',
  },
  tabLabelFocused: {
    color: '#1B5E20',
    fontWeight: '800',
  },
  tabActiveBar: {
    width: 16,
    height: 2.5,
    backgroundColor: '#1B5E20',
    borderRadius: 1.5,
    marginTop: 2,
  },
});