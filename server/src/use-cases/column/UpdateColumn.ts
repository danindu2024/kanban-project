import { IColumnRepository } from "../../domain/repositories/IColumnRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";

interface UpdateColumnRequestDTO {
    title?: string;
    order?: number;
}

interface UpdateColumnResponseDTO {
    id: string;
    board_id: string;
    title: string;
    order: number;
    tasks?: any[];
    created_at: Date;
}

export class UpdateColumnUseCase{
    private columnRepository: IColumnRepository;

    constructor(columnRepository: IColumnRepository){
        this.columnRepository = columnRepository;
    }

    async execute({title, order}: UpdateColumnRequestDTO, columnId: string): Promise<UpdateColumnResponseDTO | null> {

        //Check if EVERYTHING is undefined
        if (title === undefined && order === undefined) {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "At least one field (title or order) is required to update", 400);
        }

        const columnExists = await this.columnRepository.findById(columnId);
        if (!columnExists) {
            throw new AppError(ErrorCodes.COLUMN_NOT_FOUND, "Column not found", 404);
        }

        // Check Title ONLY if the user sent it
        if (title !== undefined) {
             // Checking for empty string prevents "invisible" columns
            if (title.trim().length === 0) {
                 throw new AppError(ErrorCodes.VALIDATION_ERROR, "Column title cannot be empty", 400);
            }
            if (title.length > 25) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, "Column title must not exceed 25 characters", 400);
            }
        }

        // Check Order ONLY if the user sent it
        if (order !== undefined && (typeof order !== "number" || order < 0)) {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Column order must be a non-negative integer", 400);
        }

        const updatedColumn = await this.columnRepository.update(columnId, { title, order });

        if (!updatedColumn) {
            throw new AppError(ErrorCodes.COLUMN_NOT_FOUND, "Column not found", 404);//I added new error code
        }

        return {
            id: updatedColumn.id,
            board_id: updatedColumn.board_id,
            title: updatedColumn.title,
            order: updatedColumn.order,
            tasks: undefined, // Assuming tasks are not updated here
            created_at: updatedColumn.created_at
        };
    }
}