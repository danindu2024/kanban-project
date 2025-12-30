import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../utils/env';
import { AppError } from '../utils/AppError';
import { ErrorCodes } from '../constants/errorCodes';

interface JwtPayload {
  id: string;
}

export interface AuthRequest extends Request {
  user?: { id: string };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError(ErrorCodes.TOKEN_INVALID, 'Not authorized, no token', 401));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET as string) as JwtPayload;
    req.user = { id: decoded.id };
    next();

  } catch (error) {
    return next(new AppError(ErrorCodes.TOKEN_INVALID, 'Not authorized, token failed', 401));
  }
};