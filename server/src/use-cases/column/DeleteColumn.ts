import { IColumnRepository } from "../../domain/repositories/IColumnRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";

interface DeleteColumnRequestDTO{
    userId: string
    columnId: string
}

export class DeleteColumnUseCase{
    private columnRepository: IColumnRepository
    private userRepository: IUserRepository
    private boardRepository: IBoardRepository

    constructor(
        columnRepository: IColumnRepository,
        userRepository: IUserRepository,
        boardRepository: IBoardRepository
    ) {
        this.columnRepository = columnRepository
        this.userRepository = userRepository
        this.boardRepository = boardRepository
    }

    async execute({userId, columnId}: DeleteColumnRequestDTO): Promise<void>{
        // Fetch independent data in parallel
        const [user, column] = await Promise.all([
            this.userRepository.findById(userId),
            this.columnRepository.findById(columnId)
        ]);

        // validate user exists
        if(!user){
            throw new AppError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404)
        }
        // validate column exists
        if(!column){
            throw new AppError(ErrorCodes.COLUMN_NOT_FOUND, 'Column not found', 404)
        }

        // validate board exist
        const board = await this.boardRepository.findById(column.board_id)
        if(!board){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board not found', 404)
        }

        // Authorization check
        // only admin or owner can delete columns
        const isAdmin = user.role === 'admin'
        const isOwner = user.id.toString() == board.owner_id.toString()
        if(!isAdmin && !isOwner){
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Only admin or board owner can delete column', 403)
        }

        const isDelete = await this.columnRepository.delete(columnId)

        // prevent race condition delete cases
        if(!isDelete){
            throw new AppError(ErrorCodes.COLUMN_NOT_FOUND, 'Column not found', 404)
        }
    }
}