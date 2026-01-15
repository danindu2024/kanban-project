import { ITaskRepository } from "../../domain/repositories/ITaskRepository";
import { Priority } from "../../domain/entities/Task";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IBoardRepository } from "../../domain/repositories/IBoardRepository";

interface UpdateTaskRequestDTO {
    taskId: string;
    userId: string;
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
    private boardRepository: IBoardRepository;

    constructor(
        taskRepository: ITaskRepository, 
        userRepository: IUserRepository,
        boardRepository: IBoardRepository
    ) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.boardRepository = boardRepository;
    }
    
    async execute({ title, description, priority, assigneeId, userId, taskId }: UpdateTaskRequestDTO)
    : Promise<UpdateTaskResponseDTO | null> {
        // basic input validation
        if( title === undefined && description === undefined && priority === undefined && assigneeId === undefined ){
            throw new AppError(ErrorCodes.MISSING_INPUT, "At least one field is required to update", 400);
        }
        
        // Fetch independent data in parallel (User and Task)
        const [user, task] = await Promise.all([
            this.userRepository.findById(userId),
            this.taskRepository.findById(taskId)
        ]);

        if (!user) {
            throw new AppError(ErrorCodes.USER_NOT_FOUND, "User not found", 404);
        }
        if (!task) {
            throw new AppError(ErrorCodes.TASK_NOT_FOUND, "Task not found", 404);
        }

        // Fetch Board (Dependent on Task)
        const board = await this.boardRepository.findById(task.board_id)
        if(!board){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, "Board not found", 404);
        }

        // Only admin, board owner or members can update a task
        const isAdmin = user.role === 'admin'
        const isBoardOwner = user.id.toString() === board.owner_id.toString()
        const isMember = board.members.some((member) => member.toString() === user.id.toString())

        if(!isAdmin && !isBoardOwner && !isMember){
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Not Authorized', 403)
        }

        // Data Merging for Partial Updates
        const titleToUpdate = title !== undefined ? title : task.title;
        const priorityToUpdate = priority !== undefined ? priority : task.priority;
        // Description can be null/empty, so we check strictly against undefined
        const descriptionToUpdate = description !== undefined ? description : task.description;
        const assigneeIdToUpdate = assigneeId !== undefined ? assigneeId : task.assignee_id;

        // title validation
        if( titleToUpdate ){
            if( titleToUpdate.trim().length === 0 ){
                throw new AppError(ErrorCodes.VALIDATION_ERROR, "Task title cannot be empty", 400);
            }
            if( titleToUpdate.length > 50 ){
                throw new AppError(ErrorCodes.VALIDATION_ERROR, "Task title must not exceed 50 characters", 400);
            }
        }

        // description validation
        if( descriptionToUpdate && descriptionToUpdate.length > 500){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Task description must not exceed 500 characters", 400);
        }
 
        // priority validation
        if( priorityToUpdate ){
            if( !['low', 'medium', 'high'].includes(priorityToUpdate) ){
                throw new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid priority value", 400);
            }
        }

        if( assigneeIdToUpdate ){
            const isBoardMember = board.members.some((member) =>member.toString() === assigneeIdToUpdate )
            const isBoardOwner = board.owner_id.toString() === assigneeIdToUpdate;
            if(!isBoardMember && !isBoardOwner){
                throw new AppError(ErrorCodes.VALIDATION_ERROR, "Assignee must be a board member", 400);
            }
        }

        const updatedTask = await this.taskRepository.update(taskId, 
            { 
                title: titleToUpdate, 
                description: descriptionToUpdate, 
                priority: priorityToUpdate, 
                assignee_id:assigneeIdToUpdate
            });
        
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