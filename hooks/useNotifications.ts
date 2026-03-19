import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../services/notificationService';
import { loadServerUrl } from '../services/storage';
import { ExpenseCategory } from '../types';

type SyncExpenseFn = (expense: { amount: number; category: ExpenseCategory; note: string }) => Promise<void>;

export function useNotifications(syncExpense?: SyncExpenseFn) {
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // Register and sync push token to server
    registerForPushNotificationsAsync().then(async (token) => {
      console.log('[push] token:', token);
      if (!token) return;
      const serverUrl = await loadServerUrl();
      console.log('[push] serverUrl:', serverUrl);
      if (!serverUrl.trim()) return;
      try {
        const resp = await fetch(`${serverUrl.trim()}/api/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expoPushToken: token }),
        });
        console.log('[push] sync status:', resp.status);
      } catch (e) {
        console.log('[push] sync error:', e);
      }
    });

    // Handle notification received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data as Record<string, unknown>;
        if (data?.type === 'expense' && syncExpense) {
          syncExpense({
            amount: data.amount as number,
            category: 'other',
            note: `Auto: ${data.merchant ?? 'Apple Pay'}`,
          });
        }
      },
    );

    // Handle tap on notification (app was backgrounded)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        if (data?.type === 'expense' && syncExpense) {
          syncExpense({
            amount: data.amount as number,
            category: 'other',
            note: `Auto: ${data.merchant ?? 'Apple Pay'}`,
          });
        }
      },
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [syncExpense]);
}