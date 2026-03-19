import { Router, Request, Response } from 'express';
import { getConfig, setConfig } from '../store';

const router = Router();

// GET /api/config
router.get('/', (_req, res) => {
  res.json(getConfig());
});

// POST /api/config — called by the Expo app when settings are saved
router.post('/', (req: Request, res: Response) => {
  const { contactPhone, budget, expoPushToken } = req.body as {
    contactPhone?: string;
    budget?: number;
    expoPushToken?: string;
  };

  if (!contactPhone && budget === undefined && !expoPushToken) {
    res.status(400).json({ error: 'Provide at least one of: contactPhone, budget, expoPushToken' });
    return;
  }

  const patch = {
    ...(contactPhone && { contactPhone: contactPhone.replace(/\D/g, '') }),
    ...(budget !== undefined && { budget: Number(budget) }),
    ...(expoPushToken && { expoPushToken }),
  };


  setConfig(patch);
  res.json({ success: true, config: getConfig() });
});

export default router;