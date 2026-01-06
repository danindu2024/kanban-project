import { IColumnRepository } from '../../domain/repositories/IColumnRepository';
import { IBoardRepository } from '../../domain/repositories/IBoardRepository';
import { AppError } from '../../utils/AppError';
import { ErrorCodes } from '../../constants/errorCodes';

interface CreateColumnRequestDTO {
    boardId: string;
    title: string;
    order: number;
}

interface CreateColumnResponseDTO {
    id: string;
    board_id: string;
    title: string;
    order: number;
    tasks: never[]; // Explicitly typed as an empty array for new columns
    created_at: Date;
}

export class CreateColumnUseCase {
    private columnRepository: IColumnRepository;
    private boardRepository: IBoardRepository;

    constructor(columnRepository: IColumnRepository, boardRepository: IBoardRepository) {
        this.columnRepository = columnRepository;
        this.boardRepository = boardRepository;
    }

    async execute({boardId, title, order}: CreateColumnRequestDTO): Promise<CreateColumnResponseDTO> {
        if(!boardId || !title || order === undefined || order === null){
            throw new AppError(ErrorCodes.MISSING_INPUT, 'required filds are missing', 400);
        }

        if(title.length > 25){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Column title must not exceed 25 characters', 400);
        }

        if(typeof order !== "number" || order < 0){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Column order must be a non-negative integer', 400);
        }

        //check if board exists
        const board = await this.boardRepository.findById(boardId);
        if(!board){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board not found', 404);
        }

        const newColumn = await this.columnRepository.create({
            board_id: boardId,
            title,
            order
        });
        return {
            id: newColumn.id,
            board_id: newColumn.board_id,
            title: newColumn.title,
            order: newColumn.order,
            tasks: [],
            created_at: newColumn.created_at
        };
    }
}