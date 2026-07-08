import { Router, Request, Response } from 'express';
import { authenticate, authorize, requireDepartmentScope } from '../middleware/auth';

const router = Router();

router.get('/portfolio', authenticate, authorize('ADMIN', 'EXECUTIVE', 'MANAGER'), requireDepartmentScope(), (_req: Request, res: Response) => {
  res.json({ message: 'Executive dashboard placeholder' });
});

export default router;
