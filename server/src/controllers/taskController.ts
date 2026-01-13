import { ITaskRepository } from "../domain/repositories/ITaskRepository";
import { IColumnRepository } from "../domain/repositories/IColumnRepository";
import { IBoardRepository } from "../domain/repositories/IBoardRepository";
import { IUserRepository } from "../domain/repositories/IUserRepository";
import { CreateTaskUseCase } from "../use-cases/task/CreateTask";
import { UpdateTaskUseCase } from "../use-cases/task/UpdateTask";
import { MoveTaskUseCase } from "../use-cases/task/MoveTask";
import { DeleteTaskUseCase } from "../use-cases/task/DeleteTask";
import {Request, Response, NextFunction} from 'express';
import { AuthRequest } from "../middleware/authMiddleware";

export class TaskController {
    private createTaskUseCase: CreateTaskUseCase;
    private updateTaskUseCase: UpdateTaskUseCase;
    private moveTaskUseCase: MoveTaskUseCase;
    private deleteTaskUseCase: DeleteTaskUseCase;

    constructor(taskRepository: ITaskRepository, 
        columnRepository: IColumnRepository, 
        boardRepository: IBoardRepository, 
        userRepository: IUserRepository) {

        this.createTaskUseCase = new CreateTaskUseCase(taskRepository, columnRepository, boardRepository, userRepository);
        this.updateTaskUseCase = new UpdateTaskUseCase(taskRepository, userRepository, boardRepository);
        this.moveTaskUseCase = new MoveTaskUseCase(taskRepository, columnRepository, userRepository, boardRepository);
        this.deleteTaskUseCase = new DeleteTaskUseCase(taskRepository, userRepository, boardRepository);
    }

    createTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { board_id, column_id, title, description, priority, assignee_id } = req.body;
            const userId = req.user!.id

            const task = await this.createTaskUseCase.execute({
                boardId: board_id, 
                columnId: column_id, 
                title, 
                description, 
                priority, 
                assigneeId: assignee_id,  
                userId});

            res.status(201).json({
                success: true,
                data: task
            });

        } catch (error) {
            next(error);
        }
    }

    updateTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {

            const taskId = req.params.id
            const { title, description, priority, assignee_id } = req.body;
            const userId = req.user!.id;

            const updateTaskData = await this.updateTaskUseCase.execute({ 
                title, 
                description, 
                priority, 
                assigneeId: assignee_id,
                taskId,
                userId
             });

            res.status(200).json({
                success: true,
                data: updateTaskData
            });
        } catch (error) {
            next(error);
        }
    }

    moveTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const taskId = req.params.id;
            const userId = req.user!.id;
            const { target_column_id, new_order_index } = req.body;

            await this.moveTaskUseCase.execute({
                targetColumnId: target_column_id, 
                newOrder: new_order_index,
                userId,
                taskId
            });
            
            res.status(200).json({
                success: true,
                message: "Task moved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    deleteTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const taskId = req.params.id;
            const userId = req.user!.id;

            await this.deleteTaskUseCase.execute({taskId, userId});
            res.status(200).json({
                success: true,
                message: "Task deleted successfully"
            });
        } catch (error) {
            next(error);
        }
    }
}