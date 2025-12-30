import { Request, Response, NextFunction } from 'express';
import { RegisterUserUseCase } from '../use-cases/auth/RegisterUser';
import { LoginUserUseCase } from '../use-cases/auth/LoginUser';
import { IUserRepository } from '../domain/repositories/IUserRepository';
import { GetCurrentUserUseCase } from '../use-cases/auth/GetCurrentUser';
import { AuthRequest } from '../middleware/authMiddleware';
export class AuthController {
  private registerUseCase: RegisterUserUseCase;
  private loginUseCase: LoginUserUseCase;
  private getCurrentUserUseCase: GetCurrentUserUseCase;

  constructor(userRepository: IUserRepository) {
    this.registerUseCase = new RegisterUserUseCase(userRepository);
    this.loginUseCase = new LoginUserUseCase(userRepository);
    this.getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);
  }

  registerUser = async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Please provide all fields' });
      return;
    }

    try {
      const user = await this.registerUseCase.execute({ name, email, password });
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      if ((error as Error).message === 'User already exists') {
        res.status(409).json({ success: false, message: 'User already exists' });
        return;
      }
      next(error);
    }
  };

  loginUser = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password' });
      return;
    }

    try {
      const result = await this.loginUseCase.execute({ email, password });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      if ((error as Error).message === 'Invalid credentials') {
        res.status(401).json({ success: false, message: 'Please provide valid credentials' });
        return;
      }
      next(error);
    }
  };

  getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const user = await this.getCurrentUserUseCase.execute(userId);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === 'User not found') {
        res.status(404).json({ success: false, message: errorMessage });
        return;
      }
      next(error);
    }
  };  
}