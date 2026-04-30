import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppNavigator } from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import { themedToastConfig } from './src/components/common/CustomToast';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { socketService } from './src/services/socketService';
import { initSound } from './src/services/soundService';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Centralised React Query client
const queryClient = new QueryClient();

const AppContent = () => {
  const { theme } = useTheme();
  const config = themedToastConfig(theme);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppNavigator />
        <Toast config={config} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
};

const App = () => {
  useEffect(() => {
    socketService.connect();
    initSound();
    return () => socketService.disconnect();
  }, []);

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
