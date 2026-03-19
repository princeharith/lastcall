export interface SmsResult {
  success: boolean;
  quotaRemaining?: number;
  error?: string;
}

export async function sendSMS(phone: string, message: string): Promise<SmsResult> {
  const resp = await fetch('https://textbelt.com/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: phone.replace(/\D/g, ''),
      message,
      key: process.env.TEXTBELT_API_KEY,
    }),
  });
  const data = (await resp.json()) as SmsResult & { error?: string };
  return {
    success: data.success,
    quotaRemaining: data.quotaRemaining,
    error: data.success ? undefined : (data.error ?? 'Unknown error'),
  };
}