import { NextFunction, Request, Response } from 'express';
import { DEFAULT_PAGE_SIZE, PaginatedRequest } from '../commons';

declare module 'express-serve-static-core' {
  interface Request {
    paginationParams?: PaginatedRequest;
  }
}

export const extractPaginationParams = (req: Request, res: Response, next: NextFunction): void => {
  const paginatedRequest: PaginatedRequest = {
    limit: Number(req.query['limit'] || DEFAULT_PAGE_SIZE),
    lastKey: req.query['lastKey']?.toString(),
  };

  req.paginationParams = paginatedRequest;

  next();
};
