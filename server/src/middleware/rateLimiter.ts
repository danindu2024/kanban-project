import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/AppError';
import { ErrorCodes } from '../constants/errorCodes';
import { Request, Response, NextFunction } from 'express';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers

  handler: (req, res, next) => {
    next(new AppError(
      ErrorCodes.RATE_LIMIT_EXCEEDED, 
      'Too many requests from this IP, please try again later', 
      429 // Standard code for "Too Many Requests"
    ));
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 requests per 15 minutes for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // prevent counting successful logins against the limit

  handler: (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(
      ErrorCodes.RATE_LIMIT_EXCEEDED, 
      'Too many authentication attempts, please try again later.', 
      429 // Standard code for "Too Many Requests"
    ));
  }
});