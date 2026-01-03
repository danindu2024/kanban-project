import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import env from '../utils/env';
import { ErrorCodes } from '../constants/errorCodes';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If it's custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }
  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
    success: false,
    error: {
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'Invalid ID format',
    },
  });
  return;
  }

  // Generic error fallback
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
    },
  });
};