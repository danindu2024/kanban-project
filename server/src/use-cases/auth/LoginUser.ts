import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { generateToken } from '../../utils/jwt';
import { AppError } from '../../utils/AppError';
import { ErrorCodes } from '../../constants/errorCodes';
import { businessRules } from '../../constants/businessRules';

interface LoginRequestDTO {
  email: string;
  password: string;
}

interface LoginResponseDTO{
  id: string
  name: string
  email: string
  role: string
  token: string
}

export class LoginUserUseCase {
  private userRepository: IUserRepository;

  // Inject the interface via constructor
  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute({ email, password }: LoginRequestDTO): Promise<LoginResponseDTO> {

    // basic input sanitation
    // remove leading and trailing whitespaces
    const sanitizedEmail = (email || "").trim().toLowerCase()
    const sanitizedPassword = (password || "").trim()

    // Basic presence validation
    if (!sanitizedEmail || !sanitizedPassword) {
      throw new AppError(ErrorCodes.MISSING_REQUIRED_FIELDS, 'Missing required fields', 400);
    }

    // length validation to prevent resource exhaustion
    if(sanitizedEmail.length > businessRules.MAX_EMAIL_LENGTH){
      throw new AppError(ErrorCodes.BUSINESS_RULE_VIOLATION, 'email exceed maximum allowed length', 400)
    }
    if(sanitizedPassword.length > businessRules.MAX_PASSWORD_LENGTH){
      throw new AppError(ErrorCodes.BUSINESS_RULE_VIOLATION, 'password exceed maximum allowed length', 400)
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitizedEmail)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid email format', 400);
    }

    // Check if user exists
    const user = await this.userRepository.findByEmail(sanitizedEmail);
    
    if (!user) {
      throw new AppError(ErrorCodes.INVALID_CREDENTIALS, 'Invalide email or password', 401); 
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(sanitizedPassword, user.password_hash);
    if (!isMatch) {
      throw new AppError(ErrorCodes.INVALID_CREDENTIALS, 'Invalide email or password', 401);
    }

    // Generate Token
    const token = generateToken(user.id);
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    };
  }
}