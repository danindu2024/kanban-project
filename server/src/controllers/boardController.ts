import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { CreateBoard } from "../use-cases/boards/CreateBoard";
import { GetUserBoards } from "../use-cases/boards/GetUserBoards";
import { DeleteBoard } from "../use-cases/boards/DeleteBoard";
import { AddMembers } from "../use-cases/boards/AddMembers";
import { RemoveMember } from "../use-cases/boards/RemoveMember";
import { IBoardRepository } from "../domain/repositories/IBoardRepository";
import { IUserRepository } from "../domain/repositories/IUserRepository";

export class BoardController {
  private createBoardUseCase: CreateBoard;
  private getUserBoardsUseCase: GetUserBoards;
  private deleteBoardUseCase: DeleteBoard;
  private addMembersUseCase: AddMembers
  private removeMemberUseCase: RemoveMember

  constructor(boardRepository: IBoardRepository, userRepository: IUserRepository) {
    this.createBoardUseCase = new CreateBoard(boardRepository, userRepository);
    this.getUserBoardsUseCase = new GetUserBoards(boardRepository, userRepository);
    this.deleteBoardUseCase = new DeleteBoard(boardRepository, userRepository)
    this.addMembersUseCase = new AddMembers(boardRepository, userRepository)
    this.removeMemberUseCase = new RemoveMember(boardRepository, userRepository)
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

  deleteBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try{
      const boardId = req.params.id
      const userId = req.user!.id

      await this.deleteBoardUseCase.execute(boardId, userId)
      res.status(200).json({
        success: true,
        message: 'Board Deleted successfully'
      })
    }catch(error){
      next(error)
    }
  };

  addMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try{
      const boardId = req.params.id
      const userId = req.user!.id
      const {members} = req.body

      const doc = await this.addMembersUseCase.execute({boardId, members, userId})
      res.status(200).json({
        success: true,
        data: doc,
      })
    }catch(error){
      next(error)
    }
  };

  removeMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try{
      const userId = req.user!.id
      const boardId = req.params.id
      const memberId = req.params.userId

      const response = await this.removeMemberUseCase.execute({boardId, userId, memberId})
      res.status(200).json({
        success: true,
        data: response
      })

    }catch(error){
      next(error)
    }
  }
}