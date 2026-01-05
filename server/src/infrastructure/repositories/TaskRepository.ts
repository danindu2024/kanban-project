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
        assignee_id?: string; 
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

  async update(taskId: string, updatesData: Partial<Omit<TaskEntity, 
    'id' | 'board_id' | 'column_id'>>): Promise<TaskEntity | null>{
    const updatedTask = await TaskModel.findByIdAndUpdate(
      taskId,
      updatesData,
      { new: true, runValidators: true }
    );
    
    return updatedTask ? this.mapToEntity(updatedTask) : null;
  }

  async delete(taskId: string): Promise<boolean> {
    const result = await TaskModel.deleteOne({ _id: taskId });
    return result.deletedCount > 0;
  }

  async moveTask(taskId: string, targetColumnId: string, newOrder: number): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        // Fetch the task to check its current location
        const task = await TaskModel.findById(taskId).session(session);
        if (!task) 
          throw new AppError(ErrorCodes.TASK_NOT_FOUND, 'Task not found', 404);

        const currentColumnId = task.column_id.toString();
        const isSameColumn = currentColumnId === targetColumnId;

        if (isSameColumn) {
            // SCENARIO A: Reordering within the SAME column
            if (newOrder > task.order) {
                // Moving DOWN: Shift items between old and new positions UP (-1)
                await TaskModel.updateMany(
                    { 
                        column_id: targetColumnId, 
                        order: { $gt: task.order, $lte: newOrder } 
                    },
                    { $inc: { order: -1 } }
                ).session(session);
            } else if (newOrder < task.order) {
                // Moving UP: Shift items between new and old positions DOWN (+1)
                await TaskModel.updateMany(
                    { 
                        column_id: targetColumnId, 
                        order: { $gte: newOrder, $lt: task.order } 
                    },
                    { $inc: { order: 1 } }
                ).session(session);
            }
        } else {
            // SCENARIO B: Moving to a DIFFERENT column
            
            // 1. Make room in the TARGET column (Shift items >= newOrder DOWN)
            await TaskModel.updateMany(
                { column_id: targetColumnId, order: { $gte: newOrder } },
                { $inc: { order: 1 } }
            ).session(session);

            // 2. (Optional) Close the gap in the SOURCE column
            // We shift items > oldOrder UP to keep the list clean
            await TaskModel.updateMany(
                { column_id: task.column_id, order: { $gt: task.order } },
                { $inc: { order: -1 } }
            ).session(session);
        }

        // 3. Finally, move the task itself
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