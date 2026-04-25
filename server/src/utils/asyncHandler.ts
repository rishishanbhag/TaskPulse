import type { NextFunction, Request, RequestHandler, Response } from 'express';

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  const handler: RequestHandler = (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
  return handler;
}

