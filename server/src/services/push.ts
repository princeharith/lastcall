import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPush(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!Expo.isExpoPushToken(token)) {
    console.warn(`[push] Invalid token: ${token}`);
    return;
  }

  const message: ExpoPushMessage = { to: token, sound: 'default', title, body, data };

  try {
    const [ticket] = await expo.sendPushNotificationsAsync([message]);
    if (ticket.status === 'error') console.error('[push] Error:', ticket.message);
  } catch (err) {
    console.error('[push] Failed:', err);
  }
}