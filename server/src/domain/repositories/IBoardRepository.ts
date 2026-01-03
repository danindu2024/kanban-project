import { Board } from "../entities/Board";

export interface IBoardRepository {
  create(boardData: {
    title: string;
    owner_id: string;
    members: string[];}): Promise<Board>;

  findAllByUserId(user_id: string): Promise<Board[]>;
  findById(id: string): Promise<Board | null>;
}