import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { dbModular as db } from './config';
import { doc, collection, setDoc } from 'firebase/firestore';
import { router } from 'expo-router';

// Expo Notification Handler Setup
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestPermissionAndGetToken(userId: string): Promise<string | null> {
  // Notifications are only supported on physical devices for Android/iOS
  if (Platform.OS === 'web') return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return null;
    }

    // Fetch the project ID from Expo constants if available
    const projectId = 
      Constants?.expoConfig?.extra?.eas?.projectId ?? 
      Constants?.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId, 
    });
    
    const token = tokenData.data;

    // Save token to Firestore (using Modular SDK syntax)
    const tokenDocRef = doc(db, 'users', userId, 'tokens', token);
    await setDoc(tokenDocRef, {
      token,
      platform: Platform.OS,
      updatedAt: new Date()
    });

    return token;
  } catch (error) {
    // We log but don't throw, so the main Auth flow isn't interrupted
    console.warn("Notification Token Error (Safe to ignore in dev):", error);
    return null;
  }
}

export async function scheduleLocalNotification(title: string, body: string, data: object = {}): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Send immediately
  });
}

export function listenForForegroundNotifications(): () => void {
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Received notification in foreground:', notification);
  });

  return () => subscription.remove();
}

export function handleNotificationResponse(response: Notifications.NotificationResponse): void {
  const data = response.notification.request.content.data;
  
  if (!data) return;

  switch (data.type) {
    case 'new_message':
      if (data.chatId) router.push(`/chat/${data.chatId}`);
      break;
    case 'offer_received':
    case 'price_drop':
      if (data.productId) router.push(`/product/${data.productId}`);
      break;
    default:
      router.push('/(tabs)/notifications' as any);
      break;
  }
}
