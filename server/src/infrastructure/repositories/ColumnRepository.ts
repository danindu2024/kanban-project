import { IColumnRepository } from '../../domain/repositories/IColumnRepository';
import { Column as ColumnEntity} from '../../domain/entities/Column';
import ColumnModel, { IColumnDocument } from '../models/ColumnSchema';
import BoardModel from '../models/BoardSchema';
import TaskModel from '../models/TaskSchema';
import mongoose from 'mongoose';
import { AppError } from '../../utils/AppError';
import { ErrorCodes } from '../../constants/errorCodes';
import { businessRules } from '../../constants/businessRules';

export class ColumnRepository implements IColumnRepository {

    async create(columnData: 
        { 
            board_id: string; 
            title: string; 
        }
    ) : Promise<ColumnEntity>{
        
        const session = await mongoose.startSession()

        try{
            // start transaction
            session.startTransaction()
            
            // add Mutex lock for board to prevent race condition
            const board = await BoardModel.findByIdAndUpdate(
                columnData.board_id,
                {$set: {updated_at: new Date()}}
            ).session(session)

            if(!board){
                throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board not found', 404)
            }

            // get the column count of the board
            const columnCount = await ColumnModel.countDocuments(
                {board_id: columnData.board_id}).session(session)

            // Maximum column count per board is <MAX_COLUMNS_PER_BOARD>
            if(columnCount >= businessRules.MAX_COLUMNS_PER_BOARD){
                throw new AppError(ErrorCodes.BUSINESS_RULE_VIOLATION, `Can't create new column. Maximum limit(${businessRules.MAX_COLUMNS_PER_BOARD}) exceeded`)
            }

            // create column
            const newColumn = new ColumnModel(
                {
                    ...columnData, 
                    order: columnCount // current column count equal the new column order (0 based index)
                }
            )

            const savedColumn = await newColumn.save({session})

            await session.commitTransaction()
            return this.mapToEntity(savedColumn)
        }catch(error){
            await session.abortTransaction()
            throw error
        }finally{
            session.endSession()
        }
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
        const session = await mongoose.startSession()
        session.startTransaction()
        try{
            // fetch column
            const column = await ColumnModel.findById(id).session(session)
            if(!column){
                throw new AppError(ErrorCodes.COLUMN_NOT_FOUND, "Column not found", 404)
            }

            // check tasks exists
            const tasksCount = await TaskModel.countDocuments({column_id: id}).session(session)
            
            // Can't delete column with existing tasks
            if(tasksCount > 0){
                throw new AppError(ErrorCodes.VALIDATION_ERROR, "Cannot delete column with existing tasks", 400)
            }

            const deleteResult = await ColumnModel.deleteOne({_id: id}).session(session)

            if (deleteResult.deletedCount === 0) {
                // This is safe because we return immediately and never hit the catch block
                await session.abortTransaction();
                return false;
            }

            // reorder remaining columns
            await ColumnModel.updateMany(
                {
                    board_id:  column.board_id,
                    order: {$gt: column.order}
                },
                {$inc: {order: -1}}
            ).session(session)

            await session.commitTransaction()
            return true

        }catch(error){
            if(session.inTransaction()){
                await session.abortTransaction()
            }
            throw error
        }finally{
            await session.endSession()
        }
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

    async countColumn(boardId: string): Promise<number>{
        return await ColumnModel.countDocuments({board_id: boardId})
    }

    private mapToEntity(doc: IColumnDocument): ColumnEntity {
        return {
          id: doc._id.toString(),
          board_id: doc.board_id.toString(),
          title: doc.title,
          order: doc.order,
          // The tasks will be attached in the Use Case layer
          tasks: undefined,
          created_at: doc.created_at,
          updated_at: doc.updated_at
        }
    }
}