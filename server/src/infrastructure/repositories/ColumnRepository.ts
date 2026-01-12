import { IColumnRepository } from '../../domain/repositories/IColumnRepository';
import { Column as ColumnEntity} from '../../domain/entities/Column';
import ColumnModel, { IColumnDocument } from '../models/ColumnSchema';
import mongoose from 'mongoose';
import { AppError } from '../../utils/AppError';
import { ErrorCodes } from '../../constants/errorCodes';

export class ColumnRepository implements IColumnRepository {

    async create(columnData: 
        { board_id: string; 
          title: string; 
          order: number;}): Promise<ColumnEntity>{
        const newColumn = new ColumnModel(columnData);
        const savedColumn = await newColumn.save();

        return this.mapToEntity(savedColumn);
    }

    async findByBoardId(boardId: string): Promise<ColumnEntity[]> {
        const columnDocs = await ColumnModel
          .find({board_id: boardId})
          .sort({ order: 1 });

        return columnDocs.map(doc => this.mapToEntity(doc));
    }

    async update(columnId: string, title: string): Promise<ColumnEntity | null>{
        const updatedColumn = await ColumnModel.findByIdAndUpdate(
          columnId,
          {title},
          { new: true, runValidators: true }
        );
        return updatedColumn ? this.mapToEntity(updatedColumn) : null;
    }

    async  findById(id: string): Promise<ColumnEntity | null>{
        const columnDoc =  await ColumnModel.findById(id);
        return columnDoc ? this.mapToEntity(columnDoc) : null;
    }

    async delete(id: string): Promise<Boolean>{
      const isDelete = await ColumnModel.deleteOne({_id: id})
      return isDelete.deletedCount > 0
    }

    async moveColumn(id: string, newOrder: number): Promise<void>{
     const session = await mongoose.startSession();
      session.startTransaction();
  
      try {
        // Fetch the column to check its current location
        const column = await ColumnModel.findById(id).session(session);
        if (!column) {
            throw new AppError(ErrorCodes.COLUMN_NOT_FOUND, 'Column not found', 404);
        }

        const currentOrder = column.order;
        
        // Do nothing if the order hasn't changed
        if (newOrder === currentOrder) {
             await session.abortTransaction();
             session.endSession();
             return;
        }

        if (newOrder > currentOrder) {
            // Moving DOWN: Shift items in range (0, 2] UP (-1)
            await ColumnModel.updateMany(
                {
                    board_id: column.board_id, // Only affect this board
                    order: { $gt: currentOrder, $lte: newOrder }
                },
                { $inc: { order: -1 } }
            ).session(session);
        } else {
            // Moving UP: Shift items in range [0, 2) DOWN (+1)
            await ColumnModel.updateMany(
                {
                    board_id: column.board_id, // Only affect this board
                    order: { $gte: newOrder, $lt: currentOrder }
                },
                { $inc: { order: 1 } }
            ).session(session);
        }

        // Finally, move the column itself to the target position
        await ColumnModel.findByIdAndUpdate(
            id,
            { order: newOrder }
        ).session(session);

        await session.commitTransaction();
      } catch (error) {
          await session.abortTransaction();
          throw error;
      } finally {
          session.endSession();
      }
    }

    private mapToEntity(doc: IColumnDocument): ColumnEntity {
        return {
          id: doc._id.toString(),
          board_id: doc.board_id.toString(),
          title: doc.title,
          order: doc.order,
          // The tasks will be attached in the Use Case layer
          tasks: undefined,
          created_at: doc.created_at
        }
    }
}