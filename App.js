// In your App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '@/contexts/AuthContext';
import AppNavigator from '@/navigation/AppNavigator';
import GlobalStyles from '@/components/GlobalStyles';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <GlobalStyles>
          <AppNavigator />
        </GlobalStyles>
      </NavigationContainer>
    </AuthProvider>
  );
}