import { IColumnRepository } from "../../domain/repositories/IColumnRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";

interface MoveColumnRequestDTO {
    userId: string
    columnId: string
    newOrder: number
}

export class MoveColumnUseCase {
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

    async execute({ userId, columnId, newOrder }: MoveColumnRequestDTO): Promise<void> {
        // column id comes from req params. Invalid id throw cast error
        // validate input
        if (newOrder === undefined || typeof newOrder !== 'number' || newOrder < 0) {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, 'New order must be a non-negative integer', 400)
        }

        // fetch user, column in parallel
        const [user, column] = await Promise.all([
            this.userRepository.findById(userId),
            this.columnRepository.findById(columnId)
        ])

        // verify user exists
        if (!user) {
            throw new AppError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404)
        }

        // verify column exists
        if (!column) {
            throw new AppError(ErrorCodes.COLUMN_NOT_FOUND, 'Column not found', 404)
        }

        // fetch board seperately as it depends on column
        const board = await this.boardRepository.findById(column.board_id)
        if (!board) {
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board not found', 404)
        }

        // Authorization check
        // only admin or board owner can move columns
        const isAdmin = user.role === 'admin'
        const isOwner = user.id === board.owner_id
        if (!isAdmin && !isOwner) {
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Only admin or board owner can move column', 403)
        }

        // move column (boundary check happens inside the repository transaction)
        await this.columnRepository.moveColumn(columnId, newOrder)
    }
}