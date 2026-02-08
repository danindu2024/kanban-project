import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";
import { businessRules } from "../../constants/businessRules";

interface UpdateBoardRequestDTO{
    title: string
    userId: string
    boardId: string
}

interface UpdateBoardResponseDTO{
    id: string;
    title: string;
    owner_id: string;
    members: string[];
    created_at: Date;
    updated_at: Date;
}

export class UpdateBoard{
    private boardRepository: IBoardRepository
    private userRepository: IUserRepository

    constructor(boardRepository: IBoardRepository, userRepository: IUserRepository){
        this.boardRepository = boardRepository
        this.userRepository = userRepository
    }

    async execute({title, userId, boardId}: UpdateBoardRequestDTO): Promise<UpdateBoardResponseDTO>{
        // basic input sanitazion
        const sanitizedTitle = (title || '').trim()

        // title validation
        if(sanitizedTitle.length === 0){
            throw new AppError(ErrorCodes.MISSING_REQUIRED_FIELDS, 'Title is required to update board', 400)
        }

        // fetch user, board in parallel
        const [user, board] = await Promise.all([
            this.userRepository.findById(userId),
            this.boardRepository.findById(boardId)
        ])

        // validate user exists
        if(!user){
            throw new AppError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404)
        }

        // validate board exists
        if(!board){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board not found', 404)
        }

        // only admin or board owner can update board
        // check for authority
        const isAdmin = user.role === 'admin'
        const isOwner = user.id === board.owner_id // OID are converted to string by repository layer
        if(!isAdmin && !isOwner){
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Only board owner or admin can update board details', 403)
        }

        // business rule validation
        if(sanitizedTitle.length > businessRules.MAX_BOARD_TITLE_LENGTH){
            throw new AppError(ErrorCodes.BUSINESS_RULE_VIOLATION, `Title must be less than ${businessRules.MAX_BOARD_TITLE_LENGTH} characters`, 400)
        }

        const updatedBoard = await this.boardRepository.updateBoard(boardId, sanitizedTitle)

        // defensive check to avoid race condition
        if(!updatedBoard){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board not found', 404)
        }

        return{
            ...updatedBoard
        }
    }
}