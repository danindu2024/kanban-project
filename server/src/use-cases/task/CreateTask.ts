import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { AppError } from '../../utils/AppError';
import { ErrorCodes } from '../../constants/errorCodes';
import { Priority } from '../../domain/entities/Task';
import { IColumnRepository } from '../../domain/repositories/IColumnRepository';
import { IBoardRepository } from '../../domain/repositories/IBoardRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

interface CreateTaskRequestDTO {
    userId: string;
    boardId: string;
    columnId: string;
    title: string;
    description?: string;
    priority: Priority;
    assigneeId?: string | null;
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

    constructor(
        taskRepository: ITaskRepository, 
        columnRepository: IColumnRepository, 
        boardRepository: IBoardRepository,
        userRepository: IUserRepository 
    ) {
        this.taskRepository = taskRepository;
        this.columnRepository = columnRepository;
        this.boardRepository = boardRepository;
        this.userRepository = userRepository;
    }

    async execute({ boardId, columnId, title, description, priority, assigneeId, userId}: CreateTaskRequestDTO): 
        Promise<CreateTaskResponseDTO> {
        // Check the presense of data
        // priority validate later below
        if(!title || !boardId || !columnId){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Missing required fields", 400);
        }

        // verify user exists
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new AppError(ErrorCodes.USER_NOT_FOUND, "User not found", 404);
        }

        // verify board exists
        const board = await this.boardRepository.findById(boardId);
        if(!board){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, "Board not found", 404);
        }

        // Only admin, board owner or members can create a task
        const isAdmin = user.role === 'admin'
        const isBoardOwner = user.id.toString() == board.owner_id.toString()
        const isMember = board.members.some((member) => member.toString() === user.id.toString())

        if(!isAdmin && !isBoardOwner && !isMember){
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Not Authorized', 403)
        }

        // validate presense of the column
        const column = await this.columnRepository.findById(columnId);
        if(!column || column.board_id.toString() !== boardId){
            throw new AppError(ErrorCodes.COLUMN_NOT_FOUND, "Column not found in the specified board", 404);
        }

        // 6. Validate Assignee (Assignee must be the Owner OR a Member)
        if(assigneeId) {
            const isAssigneeOwner = assigneeId === board.owner_id.toString();
            const isAssigneeMember = board.members.some(m => m.toString() === assigneeId);

            if (!isAssigneeOwner && !isAssigneeMember) {
                 throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, "Assignee must be a member of the board", 403);
            }
        }

        // Validate title
        if (title.trim().length === 0) {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Task title cannot be empty", 400);
        }
        if (title.length > 50) {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Task title must not exceed 50 characters", 400);
        }

        // Order automatically become the last task order in the column
        // for MCV, current order is counted by fetching all the columns
        const currentTasks = await this.taskRepository.findByColumnId(columnId)
        const order = currentTasks.length

        // MAX no of tasks is 20 per column
        if(order > 20)
            throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Cannot create more than 20 tasks per column', 400)

        // Validate priority
        const finalPriority: Priority = priority || 'low'; // priority set to low by default
        if(!['low', 'medium', 'high'].includes(finalPriority)){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid priority value", 400);
        }

        // Validate description
        if(description && description.length > 500){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Task description must not exceed 500 characters", 400);
        }
    
        const task = await this.taskRepository.create({ 
            column_id: columnId, 
            board_id: boardId, 
            title, 
            description, 
            priority: finalPriority, 
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