import { IColumnRepository } from "../../domain/repositories/IColumnRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";
import { businessRules } from "../../constants/businessRules";

interface UpdateColumnRequestDTO {
    userId: string;
    columnId: string
    title: string;
}

interface UpdateColumnResponseDTO {
    id: string;
    board_id: string;
    title: string;
    order: number;
    created_at: Date;
    updated_at: Date;
}

export class UpdateColumnUseCase{
    private columnRepository: IColumnRepository;
    private userRepository: IUserRepository;
    private boardRepository: IBoardRepository;

    constructor(
        columnRepository: IColumnRepository,
        userRepository: IUserRepository,
        boardRepository: IBoardRepository
    ){
        this.columnRepository = columnRepository;
        this.userRepository = userRepository;
        this.boardRepository = boardRepository;
    }

    async execute({userId, columnId, title}: UpdateColumnRequestDTO): Promise<UpdateColumnResponseDTO | null> {
        // basic input sanitation
        const sanitizedTitle = (title || '').trim()

        // title validation
        if(sanitizedTitle.length === 0){
            throw new AppError(ErrorCodes.MISSING_REQUIRED_FIELDS, 'Title is required to update column', 400)
        }

        // fetch user and column in parallel
        const [user, column] = await Promise.all([
            this.userRepository.findById(userId),
            this.columnRepository.findById(columnId)
        ])

        // verify user exists
        if(!user){
            throw new AppError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404)
        }

        // verify column exists
        if(!column){
            throw new AppError(ErrorCodes.COLUMN_NOT_FOUND, 'Column not found', 404)
        }

        // verify board exists (fetch after column as it depend on column data)
        const board = await this.boardRepository.findById(column.board_id)
        if(!board){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board not found', 404)
        }

        // Authorization check
        // only admin or owner can update columns
        const isAdmin = user.role === 'admin'
        const isOwner = user.id === board.owner_id // OID convert to string in repository
        if(!isAdmin && !isOwner){
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Only admin or board owner can update column', 403)
        }

        // business rule validation
        if(sanitizedTitle.length > businessRules.MAX_COLUMN_TITLE_LENGTH){
            throw new AppError(ErrorCodes.BUSINESS_RULE_VIOLATION, `Column title must not exceed ${businessRules.MAX_COLUMN_TITLE_LENGTH} characters`, 400);
        }

        const updatedColumn = await this.columnRepository.update(columnId, sanitizedTitle);

        // defensive check to handle race condition
        if (!updatedColumn) {
            throw new AppError(ErrorCodes.COLUMN_NOT_FOUND, "Column not found", 404);
        }

        return {
            ...updatedColumn
        };
    }
}