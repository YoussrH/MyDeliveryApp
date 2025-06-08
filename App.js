

  // File: App.jsimport React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import AppNavigator from '@/navigation/AppNavigator';
import GlobalStyles from '@/components/GlobalStyles';
import { LivreurSocketProvider } from '@/contexts/SocketContext';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <LivreurSocketProvider>
          <NavigationContainer>
            <GlobalStyles>
              <AppNavigator />
            </GlobalStyles>
          </NavigationContainer>
        </LivreurSocketProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}