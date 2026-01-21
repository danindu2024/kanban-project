import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";
import { businessRules } from "../../constants/businessRules";

interface CreateBoardRequestDTO {
  title: string;
  owner_id: string;
  // members are not add for the board when creating. They will be added later in a separate function.
  // maintain atomic rule
}

interface CreateBoardResponseDTO {
  id: string;
  title: string;
  owner_id: string;
  members: string[];
  created_at: Date;
}

export class CreateBoard {
  private boardRepository: IBoardRepository;
  private userRepository: IUserRepository;

  constructor(boardRepository: IBoardRepository, userRepository: IUserRepository) {
    this.boardRepository = boardRepository;
    this.userRepository = userRepository
  }

  async execute({ title, owner_id }: CreateBoardRequestDTO): Promise<CreateBoardResponseDTO> {
    // validate user exists
    const user = await this.userRepository.findById(owner_id);
    if (!user) throw new AppError(ErrorCodes.USER_NOT_FOUND, "User not found", 404);

    //sanitize title
    const sanitizedTitle = (title || "").trim()

    // title validation
    if(sanitizedTitle.length === 0){
      throw new AppError(
        ErrorCodes.MISSING_REQUIRED_FIELDS, 
        "Title is required to create a board",
        400
      );
    }
    if(sanitizedTitle.length > businessRules.MAX_BOARD_TITLE_LENGTH){
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        `Board title must be less than ${businessRules.MAX_BOARD_TITLE_LENGTH} characters`,
        400
      );
    }

    const board = await this.boardRepository.create({
      title: sanitizedTitle,
      owner_id,
      members: [],
    });
    
    return {
      id: board.id,
      title: board.title,
      owner_id: board.owner_id,
      members: board.members,
      created_at: board.created_at
    };
  }
}