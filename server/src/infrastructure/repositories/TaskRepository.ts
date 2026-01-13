import { ITaskRepository } from "../../domain/repositories/ITaskRepository";
import { Task as TaskEntity } from "../../domain/entities/Task";
import { Priority } from "../../domain/entities/Task";
import TaskModel from '../models/TaskSchema'
import { ITaskDocument } from "../models/TaskSchema";
import mongoose from "mongoose";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";

export class TaskRepository implements ITaskRepository {
  async create(taskData: 
      { column_id: string; 
        board_id: string; 
        title: string; 
        description?: string; 
        priority: Priority; 
        assignee_id?: string | null
        order: number }): Promise<TaskEntity>{
            const newTask = new TaskModel(taskData)
            const savedTask = await newTask.save()

            return this.mapToEntity(savedTask)
        }
  
  async findByColumnId(columnId: string): Promise<TaskEntity[]> {
    const taskDocs = await TaskModel
      .find({column_id: columnId})
      .sort({ order: 1 });

    return taskDocs.map((doc) => this.mapToEntity(doc));
  }

  async findByBoardId(boardId: string): Promise<TaskEntity[]>{
    const taskDocs = await TaskModel
    .find({board_id: boardId})
    .sort({ order: 1 });

    return taskDocs.map((doc) => this.mapToEntity(doc));
  }

  async update(taskId: string, updatesData: {
        title: string, 
        description?: string, 
        priority: Priority, 
        assignee_id?: string | null}): Promise<TaskEntity | null>{

    const updatedTask = await TaskModel.findByIdAndUpdate(
      taskId,
      updatesData,
      { new: true, runValidators: true }
    );
    
    return updatedTask ? this.mapToEntity(updatedTask) : null;
  }

  async delete(taskId: string): Promise<boolean> {
    // use session for safe transaction
    const session = await mongoose.startSession()
    session.startTransaction()

    try{
        // Fetch the task within the session
        const task = await TaskModel.findById(taskId).session(session);

        // Safety against race condition: If task doesn't exist, throw error
        if (!task) {
            throw new AppError(ErrorCodes.TASK_NOT_FOUND, 'Task nor found', 404)
        }

        // Use-cases layer ensure task exists
        const currentOrder = task!.order
        const currentColumnId = task!.column_id.toString();

        const result = await TaskModel.deleteOne({ _id: taskId }).session(session);

        // if not deleted, abort transaction
        if (result.deletedCount === 0) {
            await session.abortTransaction();
            return false;
        }

        // close the gap of deleted item
        await TaskModel.updateMany(
            {column_id: currentColumnId,
            order: {$gt: currentOrder}
            },
            {$inc: {order: -1}}
        ).session(session)

        // commit changes
        await session.commitTransaction()
        return true
    }catch(error){
        await session.abortTransaction()
        throw error
    }finally{
        session.endSession()
    }
  }

  async findById(taskId: string): Promise<TaskEntity | null> {
    const taskDoc =  await TaskModel.findById(taskId);
    return taskDoc ? this.mapToEntity(taskDoc) : null;
  }

  async moveTask(taskId: string, targetColumnId: string, newOrder: number): Promise<void> {
    // use session for safe transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        // Fetch the task to check its current location
        const task = await TaskModel.findById(taskId).session(session);
        // Safety against race condition: If task doesn't exist, throw error
        if (!task) {
            throw new AppError(ErrorCodes.TASK_NOT_FOUND, 'Task nor found', 404)
        }

        // Use-cases layer ensure task exists
        const currentColumnId = task!.column_id.toString();
        const isSameColumn = currentColumnId === targetColumnId;
        const currentOrder = task!.order

        if (isSameColumn) {
            // SCENARIO A: Reordering within the SAME column
            // order doesn't change
            if(currentOrder === newOrder){
                await session.abortTransaction()
                session.endSession()
                return
            }
    
            if (newOrder > currentOrder) {
                // Moving DOWN: Shift items between old and new positions UP (-1)
                await TaskModel.updateMany(
                    { 
                        column_id: targetColumnId, 
                        order: { $gt: currentOrder, $lte: newOrder } 
                    },
                    { $inc: { order: -1 } }
                ).session(session);
            } else {
                // Moving UP: Shift items between new and old positions DOWN (+1)
                await TaskModel.updateMany(
                    { 
                        column_id: targetColumnId, 
                        order: { $gte: newOrder, $lt: currentOrder } 
                    },
                    { $inc: { order: 1 } }
                ).session(session);
            }
        } else {
            // SCENARIO B: Moving to a DIFFERENT column
            
            // Make room in the TARGET column : Shift items >= newOrder DOWN(+1)
            await TaskModel.updateMany(
                { column_id: targetColumnId, order: { $gte: newOrder } },
                { $inc: { order: 1 } }
            ).session(session);

            // Close the gap in the SOURCE column: Shift items < currentOrder UP(-1)
            await TaskModel.updateMany(
                { column_id: currentColumnId, order: { $gt: currentOrder } },
                { $inc: { order: -1 } }
            ).session(session);
        }

        // Finally, move the task itself
        await TaskModel.findByIdAndUpdate(
            taskId, 
            { 
                column_id: targetColumnId, 
                order: newOrder 
            }
        ).session(session);

        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
  }

    private mapToEntity(doc: ITaskDocument): TaskEntity{
        return{
          id: doc._id.toString(),
          column_id: doc.column_id.toString(),
          board_id: doc.board_id.toString(),
          title: doc.title,
          description: doc.description,
          priority: doc.priority,
          assignee_id: doc.assignee_id ? doc.assignee_id.toString() : undefined,
          order: doc.order,
          created_at: doc.created_at
        }
    }
}