import { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  const isProduction = process.env.NODE_ENV === 'production';
  if (err instanceof Error) {
    return res.status(500).json({ error: isProduction ? 'Internal server error' : err.message });
  }

  return res.status(500).json({ error: isProduction ? 'Internal server error' : 'Unexpected error' });
}
