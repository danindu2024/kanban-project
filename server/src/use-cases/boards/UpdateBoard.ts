import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";

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
}

export class UpdateBoard{
    private boardRepository: IBoardRepository
    private userRepository: IUserRepository

    constructor(boardRepository: IBoardRepository, userRepository: IUserRepository){
        this.boardRepository = boardRepository
        this.userRepository = userRepository
    }

    async execute({title, userId, boardId}: UpdateBoardRequestDTO): Promise<UpdateBoardResponseDTO>{
        // is user exists
        const user = await this.userRepository.findById(userId)
        if(!user){
            throw new AppError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404)
        }

        // id board exists
        const board = await this.boardRepository.findById(boardId)
        if(!board){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board not found', 404)
        }

        // only admin or board owner can update board
        // check for authority
        const isAdmin = user.role === 'admin'
        const isOwner = user.id.toString() === board.owner_id.toString()
        if(!isAdmin && !isOwner){
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Only board owner or admin can update this board', 403)
        }

        // validate title
        // Check for empty strings or just whitespace
        if (!title || title.trim().length === 0) {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Title is required to update a board.', 400);
        }
        // vlaidate title length
        if (title.length > 100) {
            throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Board title must be less than 100 characters.', 400);
        }

        const updatedBoard = await this.boardRepository.updateBoard(boardId, title)
        if(!updatedBoard){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board not found', 404)
        }

        return{
            id: updatedBoard.id,
            title: updatedBoard.title,
            owner_id: updatedBoard.owner_id,
            members: updatedBoard.members,
            created_at: updatedBoard.created_at
        }
    }
}