import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppNavigator } from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/common/CustomToast';


// Centralised React Query client
const queryClient = new QueryClient();

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useEffect } from 'react';
import { socketService } from './src/services/socketService';

const App = () => {
  useEffect(() => {
    socketService.connect();
    return () => socketService.disconnect();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppNavigator />
        <Toast config={toastConfig} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
};

export default App;
