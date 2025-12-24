import { Request, Response } from "express";
import { CreateBoard } from "../use-cases/boards/CreateBoard";
import { GetUserBoards } from "../use-cases/boards/GetUserBoards";
import { BoardRepository } from "../infrastructure/repositories/BoardRepository";

// Dependency Injection (Manually done here for simplicity)
const boardRepository = new BoardRepository();
const createBoardUseCase = new CreateBoard(boardRepository);
const getUserBoardsUseCase = new GetUserBoards(boardRepository);

export const createBoard = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    // Assuming authMiddleware populates req.user
    const userId = (req as any).user.id; 

    const board = await createBoardUseCase.execute({ title, ownerId: userId });

    res.status(201).json({
      success: true,
      data: board,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: { message: error.message },
    });
  }
};

export const getBoards = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const boards = await getUserBoardsUseCase.execute(userId);

    res.status(200).json({
      success: true,
      data: boards,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: "Server Error" },
    });
  }
};