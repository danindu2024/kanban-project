import { Board } from "../entities/Board";
import { PopulatedBoard } from "../entities/Board";

export interface IBoardRepository {
  create(boardData: {
    title: string;
    owner_id: string;
    members: string[];}): Promise<Board>;

  findAllByUserId(user_id: string): Promise<Board[]>;
  findById(id: string): Promise<Board | null>;
  delete(id: string): Promise<Boolean>;
  addMembers(boardId: string, members: string[]): Promise<Board | null>;
  removeMember(boardId: string, memberId: string): Promise<Board | null>;
  updateBoard(boardId: string, title: string): Promise<Board | null>;
  getPopulatedBoard(boardId: string): Promise<PopulatedBoard | null>;
}