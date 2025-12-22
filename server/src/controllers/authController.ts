import { Request, Response, NextFunction } from 'express';
import { RegisterUserUseCase } from '../use-cases/auth/RegisterUser';
import { LoginUserUseCase } from '../use-cases/auth/LoginUser';
import { UserRepository } from '../infrastructure/repositories/UserRepository';

const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ success: false, message: 'Please provide all fields' });
    return;
  }

  try {
    const userRepository = new UserRepository();
    const registerUseCase = new RegisterUserUseCase(userRepository);
    
    const user = await registerUseCase.execute({ name, email, password });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    if ((error as Error).message === 'User already exists') {
      res.status(400).json({ success: false, message: 'User already exists' });
      return;
    }
    next(error);
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Please provide email and password' });
    return;
  }

  try {
    const userRepository = new UserRepository();
    const loginUseCase = new LoginUserUseCase(userRepository);

    const result = await loginUseCase.execute({ email, password });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    
    if (errorMessage === 'Invalid credentials') {
      res.status(401).json({ success: false, message: errorMessage });
      return;
    }
    next(error);
  }
};

export { registerUser, loginUser };