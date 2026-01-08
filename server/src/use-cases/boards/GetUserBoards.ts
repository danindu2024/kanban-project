import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { Board } from "../../domain/entities/Board";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";

interface GetUserBoardsResponseDTO {
  boards: Board[];
}

export class GetUserBoards {
  private boardRepository: IBoardRepository
  private userRepository: IUserRepository

  constructor(boardRepository: IBoardRepository, userRepository: IUserRepository) {
    this.boardRepository = boardRepository;
    this.userRepository = userRepository
  }

  async execute(userId: string): Promise<GetUserBoardsResponseDTO> {
    // verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError(ErrorCodes.USER_NOT_AUTHENTICATED, "User not found. Unautherized", 404);

    const boards = await this.boardRepository.findAllByUserId(userId);
    return { boards };
  }
}