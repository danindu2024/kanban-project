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

    try {
      const user = await this.registerUseCase.execute({ name, email, password });
      res.status(201).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
  };

  loginUser = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    try {
      const result = await this.loginUseCase.execute({ email, password });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
  };

  getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

      const user = await this.getCurrentUserUseCase.execute(req.user!.id);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
  };  
}