import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";

interface RemoveMemberRequestDTO{
    boardId: string
    userId: string
    memberId: string
}

interface RemoveMemberResponseDTO{
    id: string;
    title: string;
    owner_id: string;
    members: string[];
    created_at: Date;
}

export class RemoveMember{
    private boardRepository: IBoardRepository
    private userRepository: IUserRepository

    constructor(
        boardRepository: IBoardRepository, 
        userRepository: IUserRepository,){

        this.boardRepository = boardRepository
        this.userRepository = userRepository
    }

    async execute({boardId, userId, memberId}: RemoveMemberRequestDTO): Promise<RemoveMemberResponseDTO>{
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

        // only admin or board owner can remove members
        // check for authority
        const isAdmin = user.role === 'admin'
        const isOwner = user.id.toString() === board.owner_id.toString()
        if(!isAdmin && !isOwner){
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Only admin or owner can remove members', 403)
        }

        // can't remove owner
        const isMemberTheOwner = board.owner_id.toString() === memberId
        if(isMemberTheOwner){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Cannot remove board owner from members', 400)
        }

        // is a board member
        const isMember = board.members.some((id) => id.toString() === memberId)
        if(!isMember){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, 'User is not a member of this board', 400)
        }

        const updatedBoard = await this.boardRepository.removeMember(boardId, memberId)
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