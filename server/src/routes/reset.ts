import { Router, Request, Response } from 'express';
import { resetSpending } from '../store';

const router = Router();

/** POST /api/reset — clears expenses and thresholds, keeps contact + budget */
router.post('/', (_req: Request, res: Response) => {
  resetSpending();
  res.json({ success: true });
});

export default router;
