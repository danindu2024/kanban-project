import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { generateToken } from '../../utils/jwt';

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

  // Use Constructor Injection
  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute({ name, email, password }: RegisterRequestDTO): Promise<RegisterResponseDTO> {
    const userExists = await this.userRepository.findByEmail(email);
    if (userExists) {
      throw new Error('User already exists');
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