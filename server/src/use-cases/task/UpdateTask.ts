import { ITaskRepository } from "../../domain/repositories/ITaskRepository";
import { Priority, VALID_PRIORITIES } from "../../domain/entities/Task";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { businessRules } from "../../constants/businessRules";

interface UpdateTaskRequestDTO {
    taskId: string;
    userId: string;
    title?: string;
    description?: string;
    priority?: Priority;
    assignee_id?: string | null;
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
    updated_at: Date;
}

interface UpdatesParamDTO{
  title?: string;
  description?: string;
  priority?: Priority;
  assignee_id?: string | null;
}

export class UpdateTaskUseCase {
    private taskRepository: ITaskRepository;
    private userRepository: IUserRepository;
    private boardRepository: IBoardRepository;

    constructor(
        taskRepository: ITaskRepository, 
        userRepository: IUserRepository,
        boardRepository: IBoardRepository,
    ) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.boardRepository = boardRepository;
    }
    
    async execute({ title, description, priority, assignee_id, userId, taskId }: UpdateTaskRequestDTO)
    : Promise<UpdateTaskResponseDTO | null> {

        // basic input validation
        // at least one field need to be present
        if( title === undefined && description === undefined && priority === undefined && assignee_id === undefined ){
            throw new AppError(ErrorCodes.MISSING_REQUIRED_FIELDS, "At least one field is required to update", 400);
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

        // column belongs to the specific board validation deosn't happen as we are not allowing user to modifify column id. 
        // this check is performed when creating the task

        // Only admin, board owner or members can update a task
        const isAdmin = user.role === 'admin'
        const isBoardOwner = userId === board.owner_id // repository convert object id to string before passing to this layer
        const isMember = board.members.includes(userId) // repository convert object id to string before passing to this layer

        if(!isAdmin && !isBoardOwner && !isMember){
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Not Authorized', 403)
        }

        // Build Update Payload (Only add defined fields)
        const updates: UpdatesParamDTO = {}

        // title validation
        if(title !== undefined){
            // title cannot be empty
            const sanitizedTitle = title.trim()
            if( sanitizedTitle.length === 0 ){
                throw new AppError(ErrorCodes.VALIDATION_ERROR, "Task title cannot be empty or only white spaces", 400);
            }
            // validate max length
            if( sanitizedTitle.length > businessRules.MAX_TASK_TITLE_LENGTH ){
                throw new AppError(ErrorCodes.BUSINESS_RULE_VIOLATION, `Task title must not exceed ${businessRules.MAX_TASK_TITLE_LENGTH} characters`, 400);
            }

            updates.title = sanitizedTitle
        }
        
        // validate description
        if(description !== undefined){
            // valodate max length
            const sanitizedDescription = description.trim()
            if(sanitizedDescription.length > businessRules.MAX_TASK_DESCRIPTION_LENGTH){
                throw new AppError(ErrorCodes.BUSINESS_RULE_VIOLATION, `Task description must not exceed ${businessRules.MAX_TASK_DESCRIPTION_LENGTH} characters`, 400)
            }
            updates.description = sanitizedDescription
        }
        
        // priority validation
        if(priority !== undefined){
            // We cast as 'readonly string[]' to allow checking against potentially invalid strings
            if (!(VALID_PRIORITIES as readonly string[]).includes(priority)) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid priority value", 400);
            }
            updates.priority = priority
        }

        // assignee validation
        if( assignee_id !== undefined){
            // Treat empty string or whitespace as null (Unassign)
            let finalAssigneeId = assignee_id;
            if (typeof finalAssigneeId === 'string' && finalAssigneeId.trim() === '') {
                finalAssigneeId = null;
            }

            if(finalAssigneeId !== null){
                // assignee must be a board member or board owner
                const isAssigneeMember = board.members.includes(finalAssigneeId);
                const isAssigneeOwner = board.owner_id === finalAssigneeId;
                if(!isAssigneeMember && !isAssigneeOwner){
                    throw new AppError(ErrorCodes.BUSINESS_RULE_VIOLATION, "Assignee must be a board member or board owner", 400);
                }
                // verify assignee exists
                // catch deleted users (defensive check)
                const isAssigneeExist = await this.userRepository.findById(finalAssigneeId)
                if(!isAssigneeExist){
                    throw new AppError(ErrorCodes.USER_NOT_FOUND, "Assignee doesn't exist", 404)
                }
            }
            updates.assignee_id = finalAssigneeId // assigne id can be string or null
        }

        // repository handles the partial data merging
        const updatedTask = await this.taskRepository.update(taskId, updates);
        
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
            created_at: updatedTask.created_at,
            updated_at: updatedTask.updated_at
        };
    }
}       