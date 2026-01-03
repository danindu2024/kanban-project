import { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { AppError } from "../../utils/AppError";
import { ErrorCodes } from "../../constants/errorCodes";

interface CreateBoardRequestDTO {
  title: string;
  owner_id: string;
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

  constructor(boardRepository: IBoardRepository) {
    this.boardRepository = boardRepository;
  }

  async execute({ title, owner_id }: CreateBoardRequestDTO): Promise<CreateBoardResponseDTO> {
    if(!title){
      throw new AppError(
        ErrorCodes.MISSING_INPUT, 
        "Title is required to create a board.",
        400
      );
    }

    if(title.length > 100){
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        "Board title must be less than 100 characters.",
        400
      );
    }

    const board = await this.boardRepository.create({
      title,
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