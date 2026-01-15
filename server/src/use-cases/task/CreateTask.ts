import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { AppError } from '../../utils/AppError';
import { ErrorCodes } from '../../constants/errorCodes';
import { Priority } from '../../domain/entities/Task';
import { IColumnRepository } from '../../domain/repositories/IColumnRepository';
import { IBoardRepository } from '../../domain/repositories/IBoardRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { businessRules } from '../../constants/businessRules';

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
        // Check the presence of data
        // priority validate later below
        if(!title || !boardId || !columnId){
            throw new AppError(ErrorCodes.MISSING_REQUIRED_FIELDS, "Missing required fields", 400);
        }

        // fetch user and board in parallel
        const [user, board] = await Promise.all([
            this.userRepository.findById(userId),
            this.boardRepository.findById(boardId)
        ]) 

        // verify user exists
        if (!user) {
            throw new AppError(ErrorCodes.USER_NOT_FOUND, "User not found", 404);
        }

        // verify board exists
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

        // validate column exists and in the specific board
        const column = await this.columnRepository.findById(columnId);

        if(!column || column.board_id.toString() !== boardId){
            throw new AppError(ErrorCodes.COLUMN_NOT_FOUND, "Column not found in the specified board", 404);
        }

        // 6. Validate Assignee (Assignee must be the Owner OR a Member)
        if(assigneeId) {
            const isAssigneeOwner = assigneeId === board.owner_id.toString();
            const isAssigneeMember = board.members.some(m => m.toString() === assigneeId);

            if (!isAssigneeOwner && !isAssigneeMember) {
                 throw new AppError(ErrorCodes.VALIDATION_ERROR, "Assignee must be a member of the board", 400);
            }
        }

        // Validate title
        if (title.trim().length === 0) {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Task title cannot be empty", 400);
        }
        if (title.length > businessRules.MAX_TASK_TITLE_LENGTH) {
            throw new AppError(ErrorCodes.BUSINESS_RULE_VIOLATION, "Task title must not exceed 100 characters", 400);
        }

        // Validate priority
        const finalPriority: Priority = priority || 'low'; // priority set to low by default
        if(!['low', 'medium', 'high'].includes(finalPriority)){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid priority value", 400);
        }

        // Validate description
        if(description && description.length > businessRules.MAX_TASK_DESCRIPTION_LENGTH){
            throw new AppError(ErrorCodes.BUSINESS_RULE_VIOLATION, "Task description must not exceed 1000 characters", 400);
        }
    
        const task = await this.taskRepository.create({ 
            column_id: columnId, 
            board_id: boardId, 
            title, 
            description, 
            priority: finalPriority, 
            assignee_id: assigneeId
        });

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