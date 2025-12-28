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

      if (!title) {
        res.status(400).json({
          success: false,
          message: "Please provide a title",
        });
        return;
      }

      // req.user is set by authMiddleware
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const board = await this.createBoardUseCase.execute({ 
        title, 
        ownerId: userId 
      });

      res.status(201).json({
        success: true,
        data: board,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  getBoards = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const boards = await this.getUserBoardsUseCase.execute(userId);

      res.status(200).json({
        success: true,
        data: boards,
      });
    } catch (error) {
      next(error); // Pass to error handler middleware
    }
  };
}