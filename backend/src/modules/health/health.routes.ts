import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.post('/test-zod', (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string(),
      age: z.number()
    });
    schema.parse(req.body);
    res.json({ status: 'success' });
  } catch (error) {
    next(error);
  }
});

export default router;
