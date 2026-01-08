import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";

interface AddMemberRequestDTO{
    boardId: string
    members: string[]
    userId: string
}

interface AddMemberResponseDTO{
    id: string;
    title: string;
    owner_id: string;
    members: string[];
    created_at: Date;
}

export class AddMembers {
    private boardRepository: IBoardRepository
    private userRepository: IUserRepository

    constructor(boardRepository: IBoardRepository, userRepository: IUserRepository){
        this.boardRepository = boardRepository
        this.userRepository = userRepository
    }

    async execute({boardId, members, userId}: AddMemberRequestDTO): Promise<AddMemberResponseDTO>{
        // valide user exist
        const user = await this.userRepository.findById(userId)
        if(!user){
            throw new AppError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404)
        }

        // validate board exist
        const board = await this.boardRepository.findById(boardId)
        if(!board){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board not found', 404)
        }

        // Authorization check
        // only admin or owner can add members
        const isAdmin = user.role === 'admin'
        const isOwner = user.id.toString() == board.owner_id.toString()
        if(!isAdmin && !isOwner){
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Only admin or board owner can add members', 403)
        }

        // Ensure 'members' exists and is actually an array
        if (!members || !Array.isArray(members) || members.length === 0) {
          throw new AppError(
            ErrorCodes.VALIDATION_ERROR, 
            "Request body must contain a 'members' array with at least one user ID.", 
            400
          );
        }
        
        // validate members exist
        // Convert ObjectIds to strings
        const existingMemberSet = new Set(board.members.map(m => m.toString()));

        // Create a Set for O(1) lookup of existing members
        for (const memberId of members) {
            // Is this person already in the board?
            if (existingMemberSet.has(memberId) || board.owner_id.toString() === memberId) {
               throw new AppError(ErrorCodes.VALIDATION_ERROR, `User id ${memberId} is already a member of this board`, 400); 
            }

            // Does this user exist in the DB?
            const memberUser = await this.userRepository.findById(memberId);
            if (!memberUser) {
              throw new AppError(ErrorCodes.USER_NOT_FOUND, `Member with ID ${memberId} not found`, 404);
            }
        }

        const updatedBoard = await this.boardRepository.addMembers(boardId, members)
        if(!updatedBoard){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Request failed. Board not found', 404)
        }

        return{
            id: updatedBoard.id,
            title: updatedBoard.title,
            owner_id: updatedBoard.owner_id,
            members: updatedBoard.members,
            created_at: updatedBoard.created_at,
        }
    }
}