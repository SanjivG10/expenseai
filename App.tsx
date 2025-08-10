import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TabNavigator from './navigation/TabNavigator';
import { StatusBar } from 'expo-status-bar';

import './global.css';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1">
        <NavigationContainer>
          <TabNavigator />
          <StatusBar style="light" backgroundColor="#000000" />
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
