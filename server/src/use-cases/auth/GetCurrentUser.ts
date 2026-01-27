import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { AppError } from '../../utils/AppError';
import { ErrorCodes } from '../../constants/errorCodes';

interface GetCurrentUserRequestDTO{
  userId: string;
}
interface GetCurrentUserResponseDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  // create and update dates are not passed to the response
}

export class GetCurrentUserUseCase {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute({userId}: GetCurrentUserRequestDTO): Promise<GetCurrentUserResponseDTO> {
    const user = await this.userRepository.findById(userId);
    
    // validate user exists
    if (!user) {
      throw new AppError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}