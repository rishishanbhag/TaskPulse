import type { RequestHandler } from 'express';
import type { ZodError, ZodTypeAny } from 'zod';

export function validate(schema: ZodTypeAny): RequestHandler {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      const zerr = err as ZodError;
      return res.status(400).json({
        error: {
          message: 'Validation error',
          issues: zerr.issues?.map((i) => ({ path: i.path, message: i.message })) ?? [],
        },
      });
    }
  };
}

