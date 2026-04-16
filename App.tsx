import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppNavigator } from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/common/CustomToast';


// Centralised React Query client
const queryClient = new QueryClient();

const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <AppNavigator />
      <Toast config={toastConfig} />
    </QueryClientProvider>


  );
};

export default App;
