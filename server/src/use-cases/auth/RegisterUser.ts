import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { generateToken } from '../../utils/jwt';
import { AppError } from '../../utils/AppError';
import { ErrorCodes } from '../../constants/errorCodes';

interface RegisterRequestDTO {
  name: string;
  email: string;
  password: string;
}

interface RegisterResponseDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

export class RegisterUserUseCase {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  // RESOLVED: Used 'DTO' types (from main) AND kept the validation (from fix/auth)
  async execute({ name, email, password }: RegisterRequestDTO): Promise<RegisterResponseDTO> {

    // Basic presence validation
    if (!name || !email || !password) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Missing required fields', 400);
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid email format', 400);
    }

    const userExists = await this.userRepository.findByEmail(email);
    if (userExists) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'User already exists', 400);
    }

    // length checks to prevent resource exhaustion attacks
    if (password.length < 8 || password.length > 128) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Password must be at least 8 characters and must not exceed 128 characters', 400);
    }

    if (name.length > 100) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Name must not exceed 100 characters', 400);
    }

    if (email.length > 255) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Email must not exceed 255 characters', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await this.userRepository.create({
      name,
      email,
      password_hash: passwordHash,
      role: 'user',
    });

    // generate token
    const token = generateToken(newUser.id); 

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token,
    };
  }
}