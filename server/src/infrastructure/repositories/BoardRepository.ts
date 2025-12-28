import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { Board } from "../../domain/entities/Board";
import { BoardModel, IBoardDocument } from "../models/BoardSchema";

export class BoardRepository implements IBoardRepository {
  async create(board: Board): Promise<Board> {
    const newBoard = new BoardModel({
      title: board.title,
      owner_id: board.ownerId,
      members: board.members,
    });
    const saved = await newBoard.save();
    return this.mapToEntity(saved);
  }

  async findAllByUserId(userId: string): Promise<Board[]> {
    // Find boards where user is owner OR a member
    const docs = await BoardModel.find({
      $or: [{ owner_id: userId }, { members: userId }],
    });
    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findById(id: string): Promise<Board | null> {
    const doc = await BoardModel.findById(id);
    if (!doc) return null;
    return this.mapToEntity(doc);
  }

  private mapToEntity(doc: IBoardDocument): Board {
    return new Board(
      doc._id.toString(),
      doc.title,
      doc.owner_id.toString(),
      doc.members.map((m) => m.toString()),
      doc.created_at
    );
  }
}