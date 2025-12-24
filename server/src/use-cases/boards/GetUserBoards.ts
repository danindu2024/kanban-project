import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { Board } from "../../domain/entities/Board";

export class GetUserBoards {
  constructor(private boardRepository: IBoardRepository) {}

  async execute(userId: string): Promise<Board[]> {
    return await this.boardRepository.findAllByUserId(userId);
  }
}