import { Request, Response } from 'express';
import { RegisterUserUseCase } from '../use-cases/auth/RegisterUserUseCase';
import { LoginUserUseCase } from '../use-cases/auth/LoginUserUseCase';

const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Validation (Simple check for now)
    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Please provide all fields' });
      return;
    }

    // Call the Use Case
    const registerUseCase = new RegisterUserUseCase();
    const user = await registerUseCase.execute({ name, email, password });

    // Send Response (201 Created)
    res.status(201).json({
      success: true,
      data: user,
    });

  } catch (error) {
    // Handle "User already exists" specifically
    if ((error as Error).message === 'User already exists') {
      res.status(400).json({ success: false, message: 'User already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
};

const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password' });
      return;
    }

    const loginUseCase = new LoginUserUseCase();
    const result = await loginUseCase.execute({ email, password });

    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {
    res.status(401).json({ success: false, message: (error as Error).message });
  }
};

export { registerUser, loginUser };