import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { AppError } from '../../utils/AppError';
import { ErrorCodes } from '../../constants/errorCodes';
import { Priority } from '../../domain/entities/Task';
import { IColumnRepository } from '../../domain/repositories/IColumnRepository';
import { IBoardRepository } from '../../domain/repositories/IBoardRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

interface CreateTaskRequestDTO {
    boardId: string;
    columnId: string;
    title: string;
    description?: string;
    priority?: Priority;
    assigneeId?: string | null;
    order: number;
}

interface CreateTaskResponseDTO {
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

export class CreateTaskUseCase {
    private taskRepository: ITaskRepository;
    private columnRepository: IColumnRepository;
    private boardRepository: IBoardRepository;
    private userRepository: IUserRepository;

    constructor(taskRepository: ITaskRepository, 
        columnRepository: IColumnRepository, 
        boardRepository: IBoardRepository,
        userRepository: IUserRepository) {
            this.taskRepository = taskRepository;
            this.columnRepository = columnRepository;
            this.boardRepository = boardRepository;
            this.userRepository = userRepository;
    }

    async execute({ boardId, columnId, title, description, priority, assigneeId, order }: CreateTaskRequestDTO): 
        Promise<CreateTaskResponseDTO> {

        const board = await this.boardRepository.findById(boardId);
        if(!board){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, "Board not found", 404);
        }

        const column = await this.columnRepository.findById(columnId);
        if(!column || column.board_id !== boardId){
            throw new AppError(ErrorCodes.COLUMN_NOT_FOUND, "Column not found in the specified board", 404);
        }

        const assignee = assigneeId ? await this.userRepository.findById(assigneeId) : null;
        if(assigneeId && !assignee){
            throw new AppError(ErrorCodes.USER_NOT_FOUND, "Assignee user not found", 404);
        }

        if(!title || !priority || !boardId || !columnId || order === undefined){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Missing required fields", 400);
        }

        // Validate title
        if (title.trim().length === 0) {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Task title cannot be empty", 400);
        }
        if (title.length > 50) {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Task title must not exceed 50 characters", 400);
        }

        // Validate order
        if(typeof order !== "number" || order < 0){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Order must be a non-negative integer", 400);
        }

        // Validate priority
        //If priority is not sent, default to 'low'
        const finalPriority: Priority = priority || 'low';

        if(!['low', 'medium', 'high'].includes(finalPriority)){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid priority value", 400);
        }

        // Validate description
        if(description && description.length > 300){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Task description must not exceed 300 characters", 400);
        }
    
        const task = await this.taskRepository.create({ 
            column_id: columnId, 
            board_id: boardId, 
            title, 
            description, 
            priority: priority!, 
            assignee_id: assigneeId, 
            order });

        return {
            id: task.id,
            column_id: task.column_id,
            board_id: task.board_id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            assignee_id: task.assignee_id,
            order: task.order,
            created_at: task.created_at
        };
    }
}