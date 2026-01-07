import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";

export class DeleteBoard{
    private boardRepository: IBoardRepository;
    private userRepository: IUserRepository;

    constructor(boardRepository: IBoardRepository, userRepository: IUserRepository){
        this.boardRepository = boardRepository;
        this.userRepository = userRepository;
    };

    async execute(boardId: string, userId: string): Promise<void>{
        // validate user exist
        const user = await this.userRepository.findById(userId);
        if(!user){
            throw new AppError(ErrorCodes.USER_NOT_FOUND, 'User Not Found', 404);
        };

        // validate board exist
        const board = await this.boardRepository.findById(boardId);
        if(!board){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board Not Found', 404);
        };

        // only admin or board owner can delete the board
        const isAdmin = user.role === 'admin';
        const isOwner = user.id.toString() === board.owner_id.toString();
        if(!isAdmin && !isOwner){
            throw new AppError(ErrorCodes.NOT_AUTHORIZED, 'Not Authorized', 403);
        };

        const isDeleted = await this.boardRepository.delete(boardId);

        if(!isDeleted){
            throw new AppError(ErrorCodes.BOARD_NOT_FOUND, 'Board Not Found', 404)
        }
    }
}