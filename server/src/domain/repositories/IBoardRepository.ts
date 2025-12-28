import { Board } from "../entities/Board";

export interface IBoardRepository {
  create(board: Board): Promise<Board>;
  findAllByUserId(userId: string): Promise<Board[]>;
  findById(id: string): Promise<Board | null>;
}