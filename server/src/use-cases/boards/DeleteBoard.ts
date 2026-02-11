import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";

interface DeleteBoardRequestDTO{
    userId: string;
    boardId: string;
}

export class DeleteBoard{
    private boardRepository: IBoardRepository;
    private userRepository: IUserRepository;

    constructor(boardRepository: IBoardRepository, userRepository: IUserRepository){
        this.boardRepository = boardRepository;
        this.userRepository = userRepository;
    };

    async execute({boardId, userId}: DeleteBoardRequestDTO): Promise<void>{
        // fetch user and board in parallel
        const [user, board] = await Promise.all([
            this.userRepository.findById(userId),
            this.boardRepository.findById(boardId)
        ]);

        // validate user exist
        if(!user){
            throw new AppError(ErrorCodes.USER_NOT_FOUND, 'User Not Found', 404);
        };

        // validate board exist
        if(!board){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board Not Found', 404);
        };

        // only admin or board owner can delete the board
        const isAdmin = user.role === 'admin';
        const isOwner = user.id === board.owner_id // OIDs are converted to string by repository layer
        if(!isAdmin && !isOwner){
            throw new AppError(ErrorCodes.BOARD_ACCESS_DENIED, 'Not Authorized', 403);
        };

        const isDeleted = await this.boardRepository.delete(boardId);

        // safety check to prevent race condition
        if(!isDeleted){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board Not Found', 404)
        }
    }
}