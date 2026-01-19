import { IColumnRepository } from '../../domain/repositories/IColumnRepository';
import { IBoardRepository } from '../../domain/repositories/IBoardRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { AppError } from '../../utils/AppError';
import { ErrorCodes } from '../../constants/errorCodes';
import { businessRules } from '../../constants/businessRules';

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
    // updated_at is not passed as this is a newly created object
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

        // check presence of data
        if(!boardId || !title){
            throw new AppError(ErrorCodes.MISSING_REQUIRED_FIELDS, 'Required fields are not provided', 400);
        }

        // fetch user and board in parallel
        const [user, board] = await Promise.all([
            this.userRepository.findById(userId),
            this.boardRepository.findById(boardId)
        ])

        // valide user exist
        if(!user){
            throw new AppError(ErrorCodes.USER_NOT_FOUND, "Requested user doesn't exist", 404)
        }

        // validate board exist
        if(!board){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, "Requested board doesn't exist", 404)
        }

        // Authorization check
        // only admin or board owner can create columns
        const isAdmin = user.role === 'admin'
        const isOwner = user.id === board.owner_id // id type is converted to string from the repository
        if(!isAdmin && !isOwner){
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Only admin or board owner can create column', 403)
        }

        // title validation
        if (title.trim().length === 0) {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Column title cannot be empty", 400);
        }
        if(title.length > businessRules.MAX_COLUMN_TITLE_LENGTH){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, `Column title must not exceed ${businessRules.MAX_COLUMN_TITLE_LENGTH} characters`, 400);
        }

        // Repository handles column order generation
        const newColumn = await this.columnRepository.create({
            board_id: boardId,
            title,
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