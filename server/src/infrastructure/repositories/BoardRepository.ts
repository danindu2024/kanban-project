import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { Board as BoardEntity } from "../../domain/entities/Board";
import BoardModel, {IBoardDocument } from "../models/BoardSchema";
import { businessRules } from "../../constants/businessRules";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";

export class BoardRepository implements IBoardRepository {
  async create(boardData: 
    { 
      title: string;
      owner_id: string;
      members: string[];
    }
  ) : Promise<BoardEntity> {

    // User can only create maximum <MAX_BOARDS_PER_USER>
    const boardCount = await BoardModel.countDocuments({owner_id: boardData.owner_id})
    if(boardCount >= businessRules.MAX_BOARDS_PER_USER){
      throw new AppError(ErrorCodes.BUSINESS_RULE_VIOLATION, `Can't create new board. Maximum limit(${businessRules.MAX_BOARDS_PER_USER}) exceeded`)
    }

    const newBoard = new BoardModel(boardData);
    const saved = await newBoard.save();
    return this.mapToEntity(saved);
  }

  async findAllByUserId(user_id: string): Promise<BoardEntity[]> {
    // Find boards where user is owner OR a member
    const docs = await BoardModel.find({
      $or: [{ owner_id: user_id }, { members: user_id }],
    });
    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findById(id: string): Promise<BoardEntity | null> {
    
    const doc = await BoardModel.findById(id);
    if (!doc) return null;
    return this.mapToEntity(doc);
  }

  async delete(id: string): Promise<Boolean>{
    const result = await BoardModel.deleteOne({_id: id})
    return result.deletedCount > 0;
  }

  async addMembers(boardId: string, members: string[]): Promise<BoardEntity | null>{
    const doc = await BoardModel.findByIdAndUpdate(
      boardId, 
      { 
      // $addToSet ensures no duplicates
      // $each allows pushing an array of values at once
      $addToSet: { members: { $each: members } } 
      },
      { new: true, runValidators: true }) // Return the modified document and enfore schema rules

    if(!doc) return null
    return this.mapToEntity(doc)
  }

  async removeMember(boardId: string, memberId: string): Promise<BoardEntity | null>{
    const doc = await BoardModel.findByIdAndUpdate(
      boardId,
      {$pull: {members: memberId}}, // Use $pull to remove specific item from array
      { new: true, runValidators: true }
    )

    if(!doc) return null
    return this.mapToEntity(doc)
  }

  async updateBoard(boardId: string, title: string): Promise<BoardEntity | null>{
    const updatedBoard = await BoardModel.findByIdAndUpdate(
      boardId, 
      {title},
      {new: true, runValidators: true}
    )
    if(!updatedBoard) return null
    return this.mapToEntity(updatedBoard)
  }

  private mapToEntity(doc: IBoardDocument): BoardEntity {
    return {
      id: doc._id.toString(),
      title: doc.title,
      owner_id: doc.owner_id.toString(),
      members: doc.members.map((m) => m.toString()),
      created_at: doc.created_at,
      updated_at: doc.updated_at
    }
  }
}