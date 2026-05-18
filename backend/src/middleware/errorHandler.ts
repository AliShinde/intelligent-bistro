import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../types/index';
import { logger } from '../lib/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const log = (req as Request & { log?: typeof logger }).log ?? logger;

  if (err instanceof ZodError) {
    const message = err.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
    log.warn(
      { err, code: 'INVALID_REQUEST', status: 400, path: req.path, method: req.method, issues: err.issues },
      'request.error'
    );
    res.status(400).json({ error: { code: 'INVALID_REQUEST', message } });
    return;
  }

  if (err instanceof AppError) {
    const level = err.status >= 500 ? 'error' : 'warn';
    log[level](
      { err, code: err.code, status: err.status, path: req.path, method: req.method },
      'request.error'
    );
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }

  log.error(
    { err, code: 'INTERNAL_ERROR', status: 500, path: req.path, method: req.method },
    'request.error'
  );
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
};
