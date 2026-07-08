import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import reportRoutes from './routes/reportRoutes';
import riskRoutes from './routes/riskRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const isLocalDev = process.env.NODE_ENV === 'development' && !process.env.CI;
const clientUrl = process.env.CLIENT_URL ?? (isLocalDev ? 'http://localhost:3000' : undefined);

if (!clientUrl) {
  throw new Error('CLIENT_URL must be set outside local development');
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/auth/login', loginLimiter);
app.use('/auth/register', registerLimiter);
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/projects', reportRoutes);
app.use('/status-reports', reportRoutes);
app.use('/projects', riskRoutes);
app.use('/risks', riskRoutes);
app.use('/dashboard', dashboardRoutes);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`SRM API listening on port ${port}`);
});
