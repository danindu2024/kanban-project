import { ITaskRepository } from "../../domain/repositories/ITaskRepository";
import { Priority } from "../../domain/entities/Task";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";
import { IUserRepository } from "../../domain/repositories/IUserRepository";

interface UpdateTaskRequestDTO {
    title?: string;
    description?: string;
    priority?: Priority;
    assigneeId?: string | null;
}

interface UpdateTaskResponseDTO {
    id: string;
    column_id: string;
    board_id: string;
    title: string;
    description?: string;
    priority: Priority;
    assignee_id?: string | null;
    order: number;
    created_at: Date;
}

export class UpdateTaskUseCase {
    private taskRepository: ITaskRepository;
    private userRepository: IUserRepository;

    constructor(taskRepository: ITaskRepository, userRepository: IUserRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }
    
    async execute({ title, description, priority, assigneeId }: UpdateTaskRequestDTO, 
        taskId: string): Promise<UpdateTaskResponseDTO | null> {
            
        const task = await this.taskRepository.findById(taskId);
        if (!task) {
            throw new AppError(ErrorCodes.TASK_NOT_FOUND, "Task not found", 404);
        }

        if( title === undefined && description === undefined && priority === undefined && assigneeId === undefined ){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "At least one field is required to update", 400);
        }

        if( title !== undefined ){
            if( title.trim().length === 0 ){
                throw new AppError(ErrorCodes.VALIDATION_ERROR, "Task title cannot be empty", 400);
            }

            if( title.length > 50 ){
                throw new AppError(ErrorCodes.VALIDATION_ERROR, "Task title must not exceed 50 characters", 400);
            }
        }

        if( description !== undefined ){
            if( description.length > 300 ){
                throw new AppError(ErrorCodes.VALIDATION_ERROR, "Task description must not exceed 300 characters", 400);
            }
        }
 
        if( priority !== undefined ){
            if( !['low', 'medium', 'high'].includes(priority) ){
                throw new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid priority value", 400);
            }
        }

        if( assigneeId !== undefined && assigneeId !== null){
            const assignee = await this.userRepository.findById(assigneeId);
            if(!assignee){
                throw new AppError(ErrorCodes.USER_NOT_FOUND, "Assignee user not found", 404);
            }
        }

        const updatedTask = await this.taskRepository.update(taskId, 
            { title, description, priority, assignee_id:assigneeId });
        
        if(!updatedTask){
            throw new AppError(ErrorCodes.TASK_NOT_FOUND, "Task not found", 404);
        }

        return {
            id: updatedTask.id,
            column_id: updatedTask.column_id,
            board_id: updatedTask.board_id,
            title: updatedTask.title,
            description: updatedTask.description,
            priority: updatedTask.priority,
            assignee_id: updatedTask.assignee_id,
            order: updatedTask.order,
            created_at: updatedTask.created_at
        };
    }
}       