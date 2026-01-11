import { IColumnRepository } from '../../domain/repositories/IColumnRepository';
import { IBoardRepository } from '../../domain/repositories/IBoardRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { AppError } from '../../utils/AppError';
import { ErrorCodes } from '../../constants/errorCodes';

interface CreateColumnRequestDTO {
    userId: string,
    boardId: string;
    title: string;
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
    private userRepository: IUserRepository

    constructor(
        columnRepository: IColumnRepository, 
        boardRepository: IBoardRepository,
        userRepository: IUserRepository) {

        this.columnRepository = columnRepository;
        this.boardRepository = boardRepository;
        this.userRepository = userRepository
    }

    async execute({userId, boardId, title}: CreateColumnRequestDTO): Promise<CreateColumnResponseDTO> {
        const MAX_COLUMNS = 20; // Maximum number of column per a board

        if(!boardId || !title){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, 'required filds are missing', 400);
        }

        if(title.length > 50){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Column title must not exceed 50 characters', 400);
        }

        // new column automatically put the at the end
        // For MVP, existing column count is determined by fetching all the columns
        const existingColumns = await this.columnRepository.findByBoardId(boardId);
        const order = existingColumns.length

        // maximum number of columns validation
        if (order > MAX_COLUMNS) {
           throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Maximum column limit reached for this board', 400);
        }

        // valide user exist
        const user = await this.userRepository.findById(userId)
        if(!user){
            throw new AppError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404)
        }

        // validate board exist
        const board = await this.boardRepository.findById(boardId)
        if(!board){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board not found', 404)
        }

        // Authorization check
        // only admin or owner can create columns
        const isAdmin = user.role === 'admin'
        const isOwner = user.id == board.owner_id
        if(!isAdmin && !isOwner){
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Only admin or board owner can create column', 403)
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