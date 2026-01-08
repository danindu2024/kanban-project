import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ErrorCodes } from '../constants/errorCodes';
import { verifyToken } from '../utils/jwt';
import {JwtPayload} from "jsonwebtoken";

interface AuthPayload extends JwtPayload {
  id: string;
}

export interface AuthRequest extends Request {
  user?: { id: string };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError(ErrorCodes.USER_NOT_AUTHENTICATED, 'Not authorized, no token', 401));
    }

    const decoded = verifyToken(token) as AuthPayload;

    req.user = { id: decoded.id };
    next();

  } catch (error) {
    if ((error as Error).name === 'TokenExpiredError') {
      return next(new AppError(
        ErrorCodes.TOKEN_EXPIRED, 
        'Token has expired, please login again', 
        401
      ));
    }

    next(new AppError(
      ErrorCodes.TOKEN_INVALID, 
      'Invalid token', 
      401
    ));
  }
};