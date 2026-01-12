import { IColumnRepository } from "../../domain/repositories/IColumnRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";

interface MoveColumnRequestDTO{
    userId: string
    columnId: string
    newOrder: number
}

export class MoveColumnUseCase{
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

    async execute({userId, columnId, newOrder}: MoveColumnRequestDTO): Promise<void>{
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
        const isOwner = user.id.toString() == board.owner_id.toString()
        if(!isAdmin && !isOwner){
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Only admin or board owner can update column', 403)
        }

        if(newOrder === undefined){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, 'New order must be provided', 400)
        }

        if(typeof newOrder !== 'number' || newOrder < 0){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Neworder must be non a negative integer')
        }

        await this.columnRepository.moveColumn(columnId, newOrder)
    }
}