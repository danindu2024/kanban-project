import { IColumnRepository } from "../../domain/repositories/IColumnRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";

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
        // valide user exist
        const user = await this.userRepository.findById(userId)
        if(!user){
            throw new AppError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404)
        }

        // validate column exists
        const column = await this.columnRepository.findById(columnId)
        if(!column){
            throw new AppError(ErrorCodes.COLUMN_NOT_FOUND, 'Column not found', 404)
        }

        // validate board exist
        const board = await this.boardRepository.findById(column.board_id)
        if(!board){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board not found', 404)
        }

        // Authorization check
        // only admin or owner can create columns
        const isAdmin = user.role === 'admin'
        const isOwner = user.id == board.owner_id
        if(!isAdmin && !isOwner){
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Only admin or board owner can update column', 403)
        }

        // validate title
        if (!title || title.trim().length === 0) {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Title can not be empty", 400);
        }
        if(title.length > 50){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, "Column title must not exceed 50 characters", 400);
        }

        const updatedColumn = await this.columnRepository.update(columnId, title);

        if (!updatedColumn) {
            throw new AppError(ErrorCodes.COLUMN_NOT_FOUND, "Column not found", 404);
        }

        return {
            id: updatedColumn.id,
            board_id: updatedColumn.board_id,
            title: updatedColumn.title,
            order: updatedColumn.order,
            created_at: updatedColumn.created_at
        };
    }
}