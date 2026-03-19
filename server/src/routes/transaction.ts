import { Router, Request, Response } from 'express';
import { sendSMS } from '../services/textbelt';
import { sendPush } from '../services/push';
import { getConfig, recordExpense, thresholdMessage } from '../store';

const router = Router();

/**
 * POST /api/transaction
 * Body: { amount: string | number, merchant?: string }
 */
router.post('/', async (req: Request, res: Response) => {
  const { amount, merchant } = req.body as {
    amount?: string | number;
    merchant?: string;
  };

  if (amount === undefined || amount === null) {
    res.status(400).json({ error: 'Missing amount in body' });
    return;
  }

  const numericAmount = parseFloat(String(amount).replace(/[$,]/g, ''));
  if (isNaN(numericAmount)) {
    res.status(400).json({ error: `Could not parse amount: "${amount}"` });
    return;
  }

  const { contactPhone, budget, expoPushToken } = getConfig();
  if (!contactPhone) {
    res.status(503).json({ error: 'No contact phone configured. Save a trusted contact in the app first.' });
    return;
  }

  // Record expense and get any newly crossed thresholds
  const newThresholds = recordExpense(numericAmount);
  const { totalSpent } = getConfig();

  const merchantName = merchant?.trim() || 'Unknown merchant';

  // Push to app so it can sync the expense to local state
  if (expoPushToken) {
    await sendPush(
      expoPushToken,
      `💳 $${numericAmount.toFixed(2)} at ${merchantName}`,
      'Logged automatically via Apple Pay',
      { type: 'expense', amount: numericAmount, merchant: merchantName },
    );
  }

  // SMS for each newly crossed threshold
  let alertsSent = 0;
  for (const t of newThresholds) {
    const message = thresholdMessage(t, totalSpent ?? 0, budget ?? 0);
    await sendSMS(contactPhone, message);
    alertsSent++;
  }
  console.log(`[transaction] $${numericAmount.toFixed(2)} at ${merchantName} | total: $${(totalSpent ?? 0).toFixed(2)} | alerts: ${alertsSent}`);

  res.json({
    success: true,
    transaction: { amount: numericAmount, merchant: merchantName },
    budget: {
      total: totalSpent,
      limit: budget,
      percentUsed: budget ? Math.round(((totalSpent ?? 0) / budget) * 100) : null,
    },
    alertsSent,
  });
});

export default router;