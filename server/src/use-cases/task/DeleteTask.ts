import { ITaskRepository } from "../../domain/repositories/ITaskRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IBoardRepository } from "../../domain/repositories/IBoardRepository";

export class DeleteTaskUseCase {
    private taskRepository: ITaskRepository;
    private userRepository: IUserRepository;
    private boardRepository: IBoardRepository;

    constructor(taskRepository: ITaskRepository, userRepository: IUserRepository, boardRepository: IBoardRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.boardRepository = boardRepository;
    }

    async execute(taskId: string, userId: string): Promise<void> {

        const task = await this.taskRepository.findById(taskId);
        if (!task) {
            throw new AppError(ErrorCodes.TASK_NOT_FOUND, "Task not found", 404);
        }

        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new AppError(ErrorCodes.USER_NOT_FOUND, "User not found", 404);
        }

        const board = await this.boardRepository.findById(task.board_id);
        if (!board) {
            // Should theoretically never happen if referential integrity is kept
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, "Associated board not found", 404);
        }

        const userRole = user.role;
        const isOwner = board.owner_id.toString() === userId.toString();
        const isAdmin = userRole === 'admin';

        // Only admin or board owner can delete the task
        if (!isAdmin && !isOwner) {
            throw new AppError(ErrorCodes.NOT_AUTHORIZED, `You do not have permission to delete this task`, 403);
        }

        const isDeleted = await this.taskRepository.delete(taskId);
        if (!isDeleted) {
            throw new AppError(ErrorCodes.TASK_NOT_FOUND, `task not found`, 404);
        }
    }
}