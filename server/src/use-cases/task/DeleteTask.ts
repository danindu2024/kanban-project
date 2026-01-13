import { ITaskRepository } from "../../domain/repositories/ITaskRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IBoardRepository } from "../../domain/repositories/IBoardRepository";

interface DeleteTaskRequestDTO{
    userId: string;
    taskId: string;
}

export class DeleteTaskUseCase {
    private taskRepository: ITaskRepository;
    private userRepository: IUserRepository;
    private boardRepository: IBoardRepository;

    constructor(taskRepository: ITaskRepository, userRepository: IUserRepository, boardRepository: IBoardRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.boardRepository = boardRepository;
    }

    async execute({taskId, userId}: DeleteTaskRequestDTO): Promise<void> {
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

        // Only admin or board owner can delete a task
        const isAdmin = user.role === 'admin'
        const isBoardOwner = user.id.toString() === board.owner_id.toString()

        if(!isAdmin && !isBoardOwner){
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Not Authorized', 403)
        }

        // repository handle the reordering of remaining tasks
        const isDeleted = await this.taskRepository.delete(taskId);
        if (!isDeleted) {
            throw new AppError(ErrorCodes.TASK_NOT_FOUND, `task not found`, 404);
        }
    }
}