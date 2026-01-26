import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { Board as BoardEntity, PopulatedBoard as PopulatedBoardEntity} from "../../domain/entities/Board";
import BoardModel, {IBoardDocument } from "../models/BoardSchema";
import { businessRules } from "../../constants/businessRules";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";
import { IColumnDocument } from "../models/ColumnSchema";
import { ITaskDocument } from "../models/TaskSchema";

// Helper interface for populated board document
type PopulatedBoardDoc = IBoardDocument & {
  columns: (IColumnDocument & {
    tasks: ITaskDocument[];
  })[];
};

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

  async getPopulatedBoard(boardId: string): Promise<PopulatedBoardEntity | null> {
    const doc = await BoardModel.findById(boardId)
      .populate({
        path: 'columns',
        select: 'title order created_at updated_at', // Note: _id is auto-selected
        populate: {
          path: 'tasks',
          select: 'title description priority assignee_id order created_at updated_at' // Note: _id is auto-selected
        }
      })
      .exec();

    if (!doc) return null;

    // cast to populated board documnet type
    // We CANNOT avoid this cast because TS cannot infer deep population automatically
    const populatedDoc = doc as unknown as PopulatedBoardDoc;

    // Map the base Board fields using your existing helper
    const baseBoard = this.mapToEntity(doc);

    // Construct the full PopulatedBoard object
    const result: PopulatedBoardEntity = {
      ...baseBoard,
      columns: populatedDoc.columns.map((col) => ({
        id: col._id.toString(),
        board_id: boardId,
        title: col.title,
        order: col.order,
        created_at: col.created_at,
        updated_at: col.updated_at,
        // Map the Tasks inside the Column
        tasks: col.tasks.map((task) => ({
          id: task._id.toString(),
          title: task.title,
          description: task.description || "", // Handle optional fields
          priority: task.priority,
          assignee_id: task.assignee_id ? task.assignee_id.toString() : null,
          column_id: col._id.toString(),
          board_id: boardId,
          order: task.order,
          created_at: task.created_at,
          updated_at: task.updated_at
        }))
      }))
    };

    return result;
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