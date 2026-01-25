import { IBoardRepository } from "../../domain/repositories/IBoardRepository"
import { IUserRepository } from "../../domain/repositories/IUserRepository"
import { PopulatedBoard } from "../../domain/entities/Board"
import { AppError } from "../../utils/AppError"
import { ErrorCodes } from "../../constants/errorCodes"

interface GetBoardRequestDTO{
    boardId: string
    userId: string
}

// The response is simply the PopulatedBoard entity
type GetBoardResponseDTO = PopulatedBoard;

export class GetBoardUseCase{
    private boardRepository: IBoardRepository
    private userRepository: IUserRepository

    constructor(boardRepository: IBoardRepository, userRepository: IUserRepository){
        this.boardRepository = boardRepository
        this.userRepository = userRepository
    }

    async execute({boardId, userId}: GetBoardRequestDTO): Promise<GetBoardResponseDTO>{
        // basic input check
        // invalid object ID is handled by global error handler
        if(!boardId){
            throw new AppError(ErrorCodes.MISSING_REQUIRED_FIELDS, 'Missing required fields', 400)
        }

        // fetch user, board in parallel
        const [user, board] = await Promise.all([
            this.userRepository.findById(userId),
            this.boardRepository.findById(boardId) // fetch basic board here instead of populated board. If user has no access or board doesn't existes, fetching populated is waste of resources
        ])

        // check user exists
        // catched deleted users with unexpired tokens
        if(!user){
            throw new AppError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404)
        }

        // check board exists
        if(!board){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Requested board not found', 404)
        }

        // only admin, board owner or board member can fetch the board
        const isAdmin = user.role === 'admin'
        const isBoardOwner = userId === board.owner_id // OID are converted to string by repository
        const isBoardMember = board.members.includes(userId)

        if(!isAdmin && !isBoardOwner && !isBoardMember){
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Board access denied', 403)
        }

        // fetch populated board after all the validations
        const populatedBoard = await this.boardRepository.getPopulatedBoard(boardId)

        if(!populatedBoard){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Requested board not found', 404)
        }

        // no pagination strategy for sprint 1
        return populatedBoard
    }
}