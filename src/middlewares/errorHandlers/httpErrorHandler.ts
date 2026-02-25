import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../errors/http.error.js';

/**
 * Generic handler for any HttpError subclass (OCP §3.2).
 * Uses the statusCode embedded in the error, so new HttpError subtypes
 * are handled automatically without modifying this middleware.
 */
export const httpErrorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (err instanceof HttpError) {
        res.status(err.statusCode).json({
            error: err.name,
            details: err.message,
        });
        return;
    }
    next(err);
};
