import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ITaskRepository } from "../../domain/repositories/ITaskRepository";
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
    updated_at: Date;
}

export class RemoveMember{
    private boardRepository: IBoardRepository
    private userRepository: IUserRepository
    private taskRepository: ITaskRepository

    constructor(
        boardRepository: IBoardRepository, 
        userRepository: IUserRepository,
        taskRepository: ITaskRepository
    ){

        this.boardRepository = boardRepository
        this.userRepository = userRepository
        this.taskRepository = taskRepository
    }

    async execute({boardId, userId, memberId}: RemoveMemberRequestDTO): Promise<RemoveMemberResponseDTO>{
        // member id comes from req params. Mongoose throws cast error for invalide OID

        // fetch user and board in parallel
        const [user, board] = await Promise.all([
            this.userRepository.findById(userId),
            this.boardRepository.findById(boardId)
        ])

        // check user exists
        if(!user){
            throw new AppError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404)
        }

        // check board exists
        if(!board){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board not found', 404)
        }

        // only admin or board owner can remove members
        // check for authority
        const isAdmin = user.role === 'admin'
        const isOwner = user.id === board.owner_id // OID are converted to strings by repository layer
        if(!isAdmin && !isOwner){
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Only admin or owner can remove members', 403)
        }

        // can't remove owner
        const isMemberTheOwner = board.owner_id === memberId // OID are converted to strings by repository layer
        if(isMemberTheOwner){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Cannot remove board owner from members', 400)
        }

        // is a board member
        const isBoardMember = board.members.includes(memberId) // OID are converted to strings by repository layer
        if(!isBoardMember){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, 'User is not a member of this board', 400)
        }

        const updatedBoard = await this.boardRepository.removeMember(boardId, memberId)

        // defensive check - catch board deleted before update race condition
        if(updatedBoard){
            // remove member from tasks
            await this.taskRepository.unassignUserFromBoard(boardId, memberId);
        }else{
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board not found', 404)
        }

        return{
            id: updatedBoard.id,
            title: updatedBoard.title,
            owner_id: updatedBoard.owner_id,
            members: updatedBoard.members,
            created_at: updatedBoard.created_at,
            updated_at: updatedBoard.updated_at
        }
    }
}