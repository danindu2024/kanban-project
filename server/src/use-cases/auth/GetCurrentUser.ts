import { IUserRepository } from '../../domain/repositories/IUserRepository';

interface GetCurrentUserResponseDTO {
  id: string;
  name: string;
  email: string;
  role: string;
}

export class GetCurrentUserUseCase {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId: string): Promise<GetCurrentUserResponseDTO> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}