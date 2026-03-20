import { Router, Request, Response } from 'express';
import { addAppExpense, deleteExpenseById } from '../store';

const router = Router();

/**
 * POST /api/expense
 * Syncs an app-side expense to the server (no SMS triggered).
 * Body: { id, amount, merchant, timestamp }
 */
router.post('/', (req: Request, res: Response) => {
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

  addAppExpense(id, amount, merchant ?? 'Unknown', timestamp);
  res.json({ success: true });
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