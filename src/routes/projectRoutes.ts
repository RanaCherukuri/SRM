import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize, requireDepartmentScope } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize('ADMIN', 'EXECUTIVE', 'MANAGER', 'CONTRIBUTOR', 'VIEWER'), requireDepartmentScope(), (_req: Request, res: Response) => {
  res.json({ message: 'Project listing placeholder' });
});

router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), requireDepartmentScope(), (_req: Request, res: Response) => {
  res.status(201).json({ message: 'Project create placeholder' });
});

export default router;
