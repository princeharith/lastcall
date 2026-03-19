import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { AlertLevel } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('budget-alerts', {
      name: 'Budget Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B2B',
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  console.log('[push] projectId:', projectId);
  if (!projectId) return null;

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return token;
  } catch (e) {
    console.log('[push] getExpoPushTokenAsync error:', e);
    return null;
  }
}

interface LocalAlertOptions {
  alertLevel: AlertLevel;
  spent: number;
  budget: number;
}

export async function scheduleLocalBudgetAlert(options: LocalAlertOptions): Promise<void> {
  const { alertLevel, spent, budget } = options;
  const pct = Math.round((spent / budget) * 100);
  const remaining = Math.max(0, budget - spent);

  let title = '';
  let body = '';

  switch (alertLevel) {
    case 'warning':
      title = '⚠️ Budget Warning';
      body = `You've used ${pct}% of your budget. $${remaining.toFixed(2)} remaining.`;
      break;
    case 'critical':
      title = '🚨 Budget Critical';
      body = `Only $${remaining.toFixed(2)} left! You've spent ${pct}% of your budget.`;
      break;
    case 'over':
      title = '🔴 Over Budget!';
      body = `You've exceeded your $${budget} budget by $${(spent - budget).toFixed(2)}.`;
      break;
    default:
      return;
  }

  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null, // fire immediately
  });
}
