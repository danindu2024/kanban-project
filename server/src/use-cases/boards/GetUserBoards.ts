import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { Board } from "../../domain/entities/Board";

interface GetUserBoardsResponseDTO {
  boards: Board[];
}

export class GetUserBoards {
  private boardRepository: IBoardRepository

  constructor(boardRepository: IBoardRepository) {
    this.boardRepository = boardRepository;
  }

  async execute(userId: string): Promise<GetUserBoardsResponseDTO> {
    // SECURITY: userId comes from verified JWT token (authMiddleware)
    const boards = await this.boardRepository.findAllByUserId(userId);
    return { boards };
  }
}