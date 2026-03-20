import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '../services/notificationService';
import { loadServerUrl } from '../services/storage';

export function useNotifications() {
  useEffect(() => {
    registerForPushNotificationsAsync().then(async (token) => {
      if (!token) return;
      const serverUrl = await loadServerUrl();
      if (!serverUrl.trim()) return;
      fetch(`${serverUrl.trim()}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expoPushToken: token }),
      }).catch(() => {});
    });
  }, []);
}