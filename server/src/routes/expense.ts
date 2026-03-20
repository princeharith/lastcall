import { Router, Request, Response } from 'express';
import { addAppExpense, deleteExpenseById, getConfig, thresholdMessage } from '../store';
import { sendSMS } from '../services/textbelt';

const router = Router();

/**
 * POST /api/expense
 * Syncs an app-side expense to the server, checks thresholds and sends SMS.
 * Body: { id, amount, merchant, timestamp }
 */
router.post('/', async (req: Request, res: Response) => {
  const { id, amount, merchant, timestamp } = req.body as {
    id?: string;
    amount?: number;
    merchant?: string;
    timestamp?: string;
  };

  if (!id || amount === undefined || !timestamp) {
    res.status(400).json({ error: 'Missing id, amount, or timestamp' });
    return;
  }

  const newThresholds = addAppExpense(id, amount, merchant ?? 'Unknown', timestamp);
  const { contactPhone, budget, totalSpent } = getConfig();

  let alertsSent = 0;
  if (contactPhone && newThresholds.length > 0) {
    for (const t of newThresholds) {
      const message = thresholdMessage(t, totalSpent ?? 0, budget ?? 0);
      const result = await sendSMS(contactPhone, message);
      console.log(`[sms] result:`, result);
      alertsSent++;
    }
  }

  res.json({ success: true, alertsSent });
});

/**
 * DELETE /api/expense/:id
 */
router.delete('/:id', (req: Request, res: Response) => {
  const deleted = deleteExpenseById(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }
  res.json({ success: true });
});

export default router;