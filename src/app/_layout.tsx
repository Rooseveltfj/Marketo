import React, { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { 
  useFonts, 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_600SemiBold, 
  Inter_700Bold 
} from '@expo-google-fonts/inter';
import { ThemeProvider } from '@/constants/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastContainer } from '@/components/ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/services/api/queryClient';

import { onAuthStateChanged } from '@/services/firebase/auth.service';
import { useAuthStore } from '@/stores/authStore';
import * as Notifications from 'expo-notifications';
import { requestPermissionAndGetToken, handleNotificationResponse } from '@/services/firebase/notifications.service';
import { OfflineBanner } from '@/components/shared/OfflineBanner';

/*
if (__DEV__) {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  if (typeof whyDidYouRender === 'function') {
    whyDidYouRender(React, {
      trackAllPureComponents: false,
      trackHooks: true,
    });
  } else if (whyDidYouRender.default) {
    whyDidYouRender.default(React, {
      trackAllPureComponents: false,
      trackHooks: true,
    });
  }
}
*/

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [authInitialized, setAuthInitialized] = useState(false);
  const { setUser } = useAuthStore();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setUser(user);
      setAuthInitialized(true);
      if (user) {
        requestPermissionAndGetToken(user.id);
      }
    });

    return unsubscribe;
  }, [setUser]);

  useEffect(() => {
    if ((loaded || error) && authInitialized) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, authInitialized]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            {(!loaded && !error) || !authInitialized ? null : (
              <>
                <OfflineBanner />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                </Stack>
                <ToastContainer />
              </>
            )}
          </ThemeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
