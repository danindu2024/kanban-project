import { Request, Response, NextFunction } from 'express';
import { RegisterUserUseCase } from '../use-cases/auth/RegisterUser';
import { LoginUserUseCase } from '../use-cases/auth/LoginUser';
import { IUserRepository } from '../domain/repositories/IUserRepository';
export class AuthController {
  private registerUseCase: RegisterUserUseCase;
  private loginUseCase: LoginUserUseCase;

  constructor(userRepository: IUserRepository) {
    this.registerUseCase = new RegisterUserUseCase(userRepository);
    this.loginUseCase = new LoginUserUseCase(userRepository);
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
        res.status(400).json({ success: false, message: 'User already exists' });
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
      const errorMessage = (error as Error).message;
      
      if (errorMessage === 'Invalid credentials') {
        res.status(401).json({ success: false, message: errorMessage });
        return;
      }
      next(error);
    }
  };
}