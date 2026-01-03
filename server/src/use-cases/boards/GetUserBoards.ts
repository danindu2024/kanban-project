import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { Board } from "../../domain/entities/Board";

export class GetUserBoards {
  private boardRepository: IBoardRepository

  constructor(boardRepository: IBoardRepository) {
    this.boardRepository = boardRepository;
  }

  async execute(userId: string): Promise<Board[]> {
    // SECURITY: userId comes from verified JWT token (authMiddleware)
    return await this.boardRepository.findAllByUserId(userId);
  }
}