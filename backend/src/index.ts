import 'dotenv/config';
import 'express-async-errors';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './lib/logger';
import { menuRouter } from './routes/menu';
import { chatRouter } from './routes/chat';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:8081',
    'http://localhost:19006',
    'http://localhost:3000',
  ],
}));
app.use(express.json());
app.use(pinoHttp({
  logger,
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => `request.completed ${req.method} ${req.url} ${res.statusCode}`,
}));

app.get('/api/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok' });
});

app.use('/api/menu', menuRouter);
app.use('/api/chat', chatRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'server.start');
});
