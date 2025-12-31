import jwt from 'jsonwebtoken';
import env from './env'

export const generateToken = (id: string): string => {
  return jwt.sign({ id }, env.JWT_SECRET as string, {
    expiresIn: '7d',
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET as string);
};