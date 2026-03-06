import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { AppProvider, useApp } from '@/store/AppContext';
import { colors } from '@/utils/theme';

function RootLayoutNav() {
  const { isLoading, hasOnboarded, visions } = useApp();
  const router = useRouter();
  
  // Redirect to onboarding if not onboarded
  useEffect(() => {
    if (!isLoading && !hasOnboarded && visions.length === 0) {
      router.replace('/onboarding');
    }
  }, [isLoading, hasOnboarded, visions]);
  
  // If loading, show nothing (or a splash screen)
  if (isLoading) {
    return <View style={styles.loadingContainer} />;
  }
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background.primary } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="record" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          name="vision" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          name="onboarding" 
          options={{ 
            gestureEnabled: false,
            presentation: 'fullScreenModal',
          }} 
        />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <AppProvider>
        <RootLayoutNav />
      </AppProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});