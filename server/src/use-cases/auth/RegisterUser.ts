import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { generateToken } from '../../utils/jwt';
import { AppError } from '../../utils/AppError';
import { ErrorCodes } from '../../constants/errorCodes';
import { businessRules } from '../../constants/businessRules';

interface RegisterRequestDTO {
  name: string;
  email: string;
  password: string;
}

interface RegisterResponseDTO {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: Date;
  }
}

export class RegisterUserUseCase {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute({ name, email, password }: RegisterRequestDTO): Promise<RegisterResponseDTO> {

    // basic input sanitize
    // XSS attaches are handled by React's default escaping
    const sanitizedName = (name || "").trim()
    const sanitizedEmail = (email || "").trim()

    // Basic input presence validation
    if (!sanitizedName || !sanitizedEmail || !password) {
      throw new AppError(ErrorCodes.MISSING_REQUIRED_FIELDS, 'Missing required fields', 400);
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitizedEmail)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid email format', 400);
    }

    // length checks to prevent resource exhaustion attacks
    if (sanitizedEmail.length > businessRules.MAX_EMAIL_LENGTH) {
      throw new AppError(ErrorCodes.BUSINESS_RULE_VIOLATION, `Email must not exceed ${businessRules.MAX_EMAIL_LENGTH} characters`, 400);
    }

    // no strong password pattern check for sprint 1
    if (password.length < businessRules.MIN_PASSWORD_LENGTH || password.length > businessRules.MAX_PASSWORD_LENGTH) {
      throw new AppError(ErrorCodes.BUSINESS_RULE_VIOLATION, `Password must be at least ${businessRules.MIN_PASSWORD_LENGTH} characters and must not exceed ${businessRules.MAX_PASSWORD_LENGTH} characters`, 400);
    }

    if (sanitizedName.length > businessRules.MAX_USERNAME_LENGTH) {
      throw new AppError(ErrorCodes.BUSINESS_RULE_VIOLATION, 'Name must not exceed 100 characters', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // duplicate email error is handled by db + global error handler
    
    const newUser = await this.userRepository.create({
      name: sanitizedName,
      email: sanitizedEmail,
      password_hash: passwordHash,
      role: 'user',
    });

    // generate token
    const token = generateToken(newUser.id); 

    return {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at
      }
    };
  }
}