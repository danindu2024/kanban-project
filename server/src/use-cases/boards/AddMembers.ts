import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";
import { businessRules } from "../../constants/businessRules";

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
        if (!members || !Array.isArray(members) || members.length === 0) {
            throw new AppError(
                ErrorCodes.MISSING_REQUIRED_FIELDS,
                "Members list must be an array with at least one user ID.",
                400
            );
        }

        // Member array size validation
        if (members.length > businessRules.MAX_MEMBERS_PER_BATCH) {
            throw new AppError(
                ErrorCodes.BUSINESS_RULE_VIOLATION,
                `Can only add maximum of ${businessRules.MAX_MEMBERS_PER_BATCH} members at a time`,
                400
            )
        }

        // basic input sanitization
        // remove white spaces, null values, and duplicates
        const sanitizedMembers = [...new Set( //Set use to remove duplicates as it is O(1)
            members
                .map(m => (m || '').trim()) // defensive trimming
                .filter(m => m.length > 0) // remove null values
        )];

        if (sanitizedMembers.length === 0) {
            throw new AppError(ErrorCodes.MISSING_REQUIRED_FIELDS, 'Members list must contain at least one valid user ID', 400)
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
        const isOwner = user.id === board.owner_id // OID are coverted to string by repository layer
        if (!isAdmin && !isOwner) {
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Only admin or board owner can add members', 403)
        }

        // Create a Set for O(1) lookup of existing members
        const existingMemberSet = new Set(board.members); // OID array is converted to string array by repository layer

        // Fetch all valid members at once
        const newMembers = await this.userRepository.findByIds(sanitizedMembers);
        // create a set from all the valid members for O(1) lookup
        const newMembersSet = new Set(newMembers.map(n => n.id));

        // validate new members one by one
        // if any validation fails, rejects the whole batch
        for (const memberId of sanitizedMembers) {
            // Is this person already in the board?
            if (existingMemberSet.has(memberId)) {
                throw new AppError(ErrorCodes.VALIDATION_ERROR, `User id ${memberId} is already a member of this board`, 400);
            }

            // Is member the board owner
            if (memberId === board.owner_id) {
                throw new AppError(ErrorCodes.BUSINESS_RULE_VIOLATION, 'Board owner is a member by default', 400)
            }

            // Does this member exists in the DB?
            if (!newMembersSet.has(memberId)) {
                throw new AppError(ErrorCodes.USER_NOT_FOUND, `Member with ID ${memberId} not found`, 404);
            }
        }

        // Check if adding new members exceeds the board limit
        if (board.members.length + sanitizedMembers.length > businessRules.MAX_MEMBERS_PER_BOARD) {
            throw new AppError(
                ErrorCodes.BUSINESS_RULE_VIOLATION,
                `Cannot add members. Board limit of maximum ${businessRules.MAX_MEMBERS_PER_BOARD} members will be exceeded`,
                400
            )
        }

        const updatedBoard = await this.boardRepository.addMembers(boardId, sanitizedMembers)

        // defensive check to prevent race condition - delete board before update happens
        if (!updatedBoard) {
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board not found', 404)
        }

        return {
            id: updatedBoard.id,
            title: updatedBoard.title,
            owner_id: updatedBoard.owner_id,
            members: updatedBoard.members,
            created_at: updatedBoard.created_at,
            updated_at: updatedBoard.updated_at
        }
    }
}