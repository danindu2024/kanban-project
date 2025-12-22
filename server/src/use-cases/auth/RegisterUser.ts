import bcrypt from 'bcryptjs';
// CHANGE 1: Import the Interface (Domain), NOT the Implementation (Infrastructure)
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { generateToken } from '../../utils/jwt';

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export class RegisterUserUseCase {
  private userRepository: IUserRepository;

  // CHANGE 2: Use Constructor Injection
  // We ask for "ANY" repository that satisfies the contract, not specifically the Mongoose one.
  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute({ name, email, password }: RegisterRequest) {
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

    // CHANGE 3: Use the domain entity ID, not the database _id
    // Your repository mapper converts _id -> id. Use that.
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