import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { CreateBoard } from "../use-cases/boards/CreateBoard";
import { GetUserBoards } from "../use-cases/boards/GetUserBoards";
import { IBoardRepository } from "../domain/repositories/IBoardRepository";

export class BoardController {
  private createBoardUseCase: CreateBoard;
  private getUserBoardsUseCase: GetUserBoards;

  constructor(boardRepository: IBoardRepository) {
    this.createBoardUseCase = new CreateBoard(boardRepository);
    this.getUserBoardsUseCase = new GetUserBoards(boardRepository);
  }

  createBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { title } = req.body;

      // req.user is set by authMiddleware
      const userId = req.user!.id;

      const board = await this.createBoardUseCase.execute({ 
        title, 
        owner_id: userId 
      });

      res.status(201).json({
        success: true,
        data: board,
      });
    } catch (error) {
        next(error);
    }
  };

  getBoards = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // req.user is set by authMiddleware
      const userId = req.user!.id;

      const boards = await this.getUserBoardsUseCase.execute(userId);

      res.status(200).json({
        success: true,
        data: boards,
      });
    } catch (error) {
      next(error);
    }
  };
}