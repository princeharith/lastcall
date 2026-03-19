import { AlertLevel } from '../types';

export interface SmsResult {
  success: boolean;
  quotaRemaining?: number;
  error?: string;
}

export async function sendSMS(
  apiKey: string,
  to: string,
  message: string,
): Promise<SmsResult> {
  try {
    const resp = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: to.replace(/\D/g, ''), // strip non-digits
        message,
        key: apiKey,
      }),
    });
    const data = await resp.json();
    return {
      success: data.success,
      quotaRemaining: data.quotaRemaining,
      error: data.success ? undefined : (data.error || 'Unknown error'),
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function simulateSMS(to: string, message: string): Promise<SmsResult> {
  console.log(`[SIMULATED SMS to ${to}]: ${message}`);
  return { success: true };
}

export function buildAlertMessage(
  alertLevel: AlertLevel,
  spent: number,
  budget: number,
  ownerName = '',
): string {
  const pct = Math.round((spent / budget) * 100);
  const remaining = Math.max(0, budget - spent);
  const name = ownerName || 'Your friend';

  switch (alertLevel) {
    case 'warning':
      return (
        `⚠️ Last Call Alert: ${name} has spent $${spent.toFixed(2)} ` +
        `(${pct}% of $${budget} budget) this month. ` +
        `$${remaining.toFixed(2)} remaining — getting close!`
      );
    case 'critical':
      return (
        `🚨 Last Call Critical: ${name} has spent $${spent.toFixed(2)} ` +
        `(${pct}% of $${budget} budget) — only $${remaining.toFixed(2)} left!`
      );
    case 'over':
      return (
        `🔴 Last Call — OVER BUDGET: ${name} has spent $${spent.toFixed(2)} ` +
        `and exceeded their $${budget} monthly budget by $${(spent - budget).toFixed(2)}.`
      );
    default:
      return '';
  }
}