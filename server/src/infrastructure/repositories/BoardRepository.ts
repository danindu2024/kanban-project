import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { Board as BoardEntity } from "../../domain/entities/Board";
import BoardModel, {IBoardDocument } from "../models/BoardSchema";
import mongoose from "mongoose";

export class BoardRepository implements IBoardRepository {
  async create(boardData: { 
    title: string;
    owner_id: string;
    members: string[]; }): Promise<BoardEntity> {
    const newBoard = new BoardModel(boardData);
    const saved = await newBoard.save();
    return this.mapToEntity(saved);
  }

  async findAllByUserId(user_id: string): Promise<BoardEntity[]> {
    // Find boards where user is owner OR a member

    // SECURITY CHECK: If user_id is invalid, return empty instead of crashing
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return []; 
    }
    
    const docs = await BoardModel.find({
      $or: [{ owner_id: user_id }, { members: user_id }],
    });
    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findById(id: string): Promise<BoardEntity | null> {
    // SECURITY CHECK: Prevent CastError crash
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    
    const doc = await BoardModel.findById(id);
    if (!doc) return null;
    return this.mapToEntity(doc);
  }

  private mapToEntity(doc: IBoardDocument): BoardEntity {
    return {
      id: doc._id.toString(),
      title: doc.title,
      owner_id: doc.owner_id.toString(),
      members: doc.members.map((m) => m.toString()),
      created_at: doc.created_at
    }
  }
}