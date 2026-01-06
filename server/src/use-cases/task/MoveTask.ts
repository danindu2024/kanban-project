import { ITaskRepository } from "../../domain/repositories/ITaskRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";
import { IColumnRepository } from "../../domain/repositories/IColumnRepository";

interface MoveTaskRequestDTO {
    targetColumnId: string;
    newOrder: number;
}

export class MoveTaskUseCase {
    private taskRepository: ITaskRepository;
    private columnRepository: IColumnRepository;

    constructor(taskRepository: ITaskRepository, columnRepository: IColumnRepository) {
        this.taskRepository = taskRepository;
        this.columnRepository = columnRepository;
    }

    async execute(taskId: string, {targetColumnId, newOrder}: MoveTaskRequestDTO): Promise<void> {
        if(!targetColumnId || newOrder === undefined) {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "all the fields are required", 400);
        }

        const task = await this.taskRepository.findById(taskId);
        if (!task) {
            throw new AppError(ErrorCodes.TASK_NOT_FOUND, "Task not found", 404);
        }

        // Validate target column existence
        const targetColumn = await this.columnRepository.findById(targetColumnId);
        if(!targetColumn) {
            throw new AppError(ErrorCodes.COLUMN_NOT_FOUND, "Target column does not exist", 404);
        }

        // Ensure the target column belongs to the same board
        if (task.board_id !== targetColumn.board_id) {
            throw new AppError(
                ErrorCodes.BOARD_NOT_FOUND, 
                "Cannot move task to a column on a different board", 
                400
            );
        }

        // validate new order
        if(typeof newOrder !== 'number' || newOrder < 0) {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "New order must be a non-negative number", 400);
        }

        await this.taskRepository.moveTask(taskId, targetColumnId, newOrder);
    }
}