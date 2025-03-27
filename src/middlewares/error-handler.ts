import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import createHttpError, { HttpError } from 'http-errors';
import { ZodError } from 'zod';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = createHttpError.NotFound(`Route not found: ${req.method} ${req.originalUrl}`);
  console.error(error, req);

  next(error);
};

export const defaultErrorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err, req);

  const status = err instanceof HttpError ? err.status : 500;

  if ('validationError' in err && err.validationError instanceof ZodError) {
    res.status(status).json({
      error: {
        status,
        message: err.message,
        validationErrors: err.validationError.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  } else {
    res.status(status).json({
      error: {
        status,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
    });
  }

  next();
};
