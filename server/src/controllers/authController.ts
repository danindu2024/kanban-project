import { Request, Response } from 'express';
import { RegisterUserUseCase } from '../use-cases/auth/RegisterUserUseCase';

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

export { registerUser };