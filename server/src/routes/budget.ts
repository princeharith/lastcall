import { Router, Request, Response } from 'express';
import { getExpensesSince, getAllExpenses, getConfig } from '../store';

const router = Router();

/**
 * GET /api/budget?since=<ISO timestamp>
 * Returns expenses recorded after `since`, plus current budget summary.
 */
router.get('/', (req: Request, res: Response) => {
  const since = req.query.since as string | undefined;

  const expenses = since ? getExpensesSince(since) : getAllExpenses();
  const { totalSpent, budget } = getConfig();

  res.json({
    expenses,
    summary: {
      totalSpent: totalSpent ?? 0,
      budget: budget ?? null,
      percentUsed: budget ? Math.round(((totalSpent ?? 0) / budget) * 100) : null,
    },
  });
});

export default router;