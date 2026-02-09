import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";

interface AddMemberRequestDTO {
    boardId: string
    members: string[]
    userId: string
}

interface AddMemberResponseDTO {
    id: string;
    title: string;
    owner_id: string;
    members: string[];
    created_at: Date;
    updated_at: Date;
}

export class AddMembers {
    private boardRepository: IBoardRepository
    private userRepository: IUserRepository

    constructor(boardRepository: IBoardRepository, userRepository: IUserRepository) {
        this.boardRepository = boardRepository
        this.userRepository = userRepository
    }

    async execute({ boardId, members, userId }: AddMemberRequestDTO): Promise<AddMemberResponseDTO> {
        // Ensure input provided and is an array
        // should I put a member limit, array size limit
        if (!members || !Array.isArray(members) || members.length === 0) {
            throw new AppError(
                ErrorCodes.VALIDATION_ERROR,
                "Members list must be an array with at least one user ID.",
                400
            );
        }

        // basic input sanitization
        // remove duplicates, null values, and white spaces
        const sanitizedMembers = Array.from(new Set(
            members
                .map(m => (m || '').trim()) // defensive trimming
                .filter(m => m.length > 0) // remove null values
        ));

        if(sanitizedMembers.length === 0){
            throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Members list must contain at least one valid user ID', 400)    
        }

        // fetch user and board in parallel
        const [user, board] = await Promise.all([
            this.userRepository.findById(userId),
            this.boardRepository.findById(boardId)
        ])

        // validate user exists
        if (!user) {
            throw new AppError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404)
        }

        // validate board exists
        if (!board) {
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board not found', 404)
        }

        // Authorization check
        // only admin or owner can add members
        const isAdmin = user.role === 'admin'
        const isOwner = user.id == board.owner_id // OID are coverted to string by repository layer
        if (!isAdmin && !isOwner) {
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Only admin or board owner can add members', 403)
        }

        // validate members exists
        // Create a Set for O(1) lookup of existing members
        const existingMemberSet = new Set(board.members); // OID array is converted to string array by repository layer

        // Fetch all potential members at once
        const memberUsers = await this.userRepository.findByIds(sanitizedMembers);
        const foundMemberIds = new Set(memberUsers.map(u => u.id));

        for (const memberId of sanitizedMembers) {
            // Is this person already in the board?
            if (existingMemberSet.has(memberId)) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, `User id ${memberId} is already a member of this board`, 400);
            }

            // Is member the board owner
            if (memberId === board.owner_id) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Board owner is a member by default', 400)
            }

            // Does this member exists in the DB?
            if (!foundMemberIds.has(memberId)) {
                throw new AppError(ErrorCodes.USER_NOT_FOUND, `Member with ID ${memberId} not found`, 404);
            }
        }

        const updatedBoard = await this.boardRepository.addMembers(boardId, sanitizedMembers)

        // defensive check to prevent race condition
        if (!updatedBoard) {
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Request failed. Board not found', 404)
        }

        return {
            ...updatedBoard
        }
    }
}