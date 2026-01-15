import { ITaskRepository } from "../../domain/repositories/ITaskRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";
import { IColumnRepository } from "../../domain/repositories/IColumnRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IBoardRepository } from "../../domain/repositories/IBoardRepository";

interface MoveTaskRequestDTO {
    targetColumnId: string;
    newOrder: number;
    userId: string;
    taskId: string;
}

export class MoveTaskUseCase {
    private taskRepository: ITaskRepository;
    private columnRepository: IColumnRepository;
    private userRepository: IUserRepository;
    private boardRepository: IBoardRepository;

    constructor(
        taskRepository: ITaskRepository, 
        columnRepository: IColumnRepository,
        userRepository: IUserRepository,
        boardRepository: IBoardRepository
    ) {
        this.taskRepository = taskRepository;
        this.columnRepository = columnRepository;
        this.userRepository = userRepository;
        this.boardRepository = boardRepository;
    }

    async execute({targetColumnId, newOrder, taskId, userId}: MoveTaskRequestDTO): Promise<void> {
        // Validate Input Basics
        if (!targetColumnId || newOrder === undefined || newOrder < 0) {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Target column and non-negative order are required", 400);
        }

        // Fetch independent data in parallel (User ,Task, and column)
        const [user, task, targetColumn] = await Promise.all([
            this.userRepository.findById(userId),
            this.taskRepository.findById(taskId),
            this.columnRepository.findById(targetColumnId)
        ]);

        if (!user) {
            throw new AppError(ErrorCodes.USER_NOT_FOUND, "User not found", 404);
        }
        if (!task) {
            throw new AppError(ErrorCodes.TASK_NOT_FOUND, "Task not found", 404);
        }
        if(!targetColumn) {
            throw new AppError(ErrorCodes.COLUMN_NOT_FOUND, "Target column does not exist", 404);
        }

        // fetch Board seperately as it depends on task
        const board = await this.boardRepository.findById(task.board_id)

        if(!board){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, "Board not found", 404);
        }

        // Only admin, board owner or members can move a task
        const isAdmin = user.role === 'admin'
        const isBoardOwner = user.id.toString() === board.owner_id.toString()
        const isMember = board.members.some((member) => member.toString() === user.id.toString())

        if(!isAdmin && !isBoardOwner && !isMember){
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Not Authorized', 403)
        }

        // Ensure the target column belongs to the same board
        if (task.board_id.toString() !== targetColumn.board_id.toString()) {
            throw new AppError(
                ErrorCodes.BOARD_NOT_FOUND, 
                "Cannot move task to a column on a different board", 
                400
            );
        }

        // Get last task index
        const isSameColumn = task.column_id.toString() === targetColumnId;
        const taskCount = isSameColumn 
            ? await this.taskRepository.countTasks(task.column_id) // Fetch source col if same
            : await this.taskRepository.countTasks(targetColumnId); // Fetch target col if diff

        const maxAllowedOrder = isSameColumn ? taskCount - 1 : taskCount;

        // maximum tasks per column is 20
        if(maxAllowedOrder+1 >20){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Maximum tasks per column is 20', 400)
        }

        // new order must be less than last task index
        if (newOrder > maxAllowedOrder) {
            throw new AppError(
                ErrorCodes.VALIDATION_ERROR, 
                `New order (${newOrder}) exceeds last task index of (${maxAllowedOrder})`, 
                400
            );
        }
        
        await this.taskRepository.moveTask(taskId, targetColumnId, newOrder);
    }
}