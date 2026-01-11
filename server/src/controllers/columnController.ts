import { IColumnRepository } from "../domain/repositories/IColumnRepository";
import { IBoardRepository } from "../domain/repositories/IBoardRepository";
import { IUserRepository } from "../domain/repositories/IUserRepository";
import { CreateColumnUseCase } from "../use-cases/column/CreateColumn";
import { UpdateColumnUseCase } from "../use-cases/column/UpdateColumn";
import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/authMiddleware";

export class ColumnController {
    private createColumnUseCase: CreateColumnUseCase;
    private updateColumnUseCase: UpdateColumnUseCase;
    
    constructor(
        columnRepository: IColumnRepository, 
        boardRepository: IBoardRepository,
        userRepository: IUserRepository) {

        this.createColumnUseCase = new CreateColumnUseCase(columnRepository, boardRepository, userRepository);
        this.updateColumnUseCase = new UpdateColumnUseCase(columnRepository);
    }

    createColumn = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { board_id, title } = req.body;
            const userId = req.user!.id
            const newColumn = await this.createColumnUseCase.execute({ 
                userId,
                boardId: board_id, 
                title, 
             });

            return res.status(201).json({
                success: true,
                data: newColumn
            });
        } catch (error) {
            next(error);
        }
    }

    updateColumn = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const columnId = req.params.id;
            const { title, order, new_order_index } = req.body;
            const finalOrder = new_order_index !== undefined? new_order_index : order
            const updatedColumn = await this.updateColumnUseCase.execute({ title, order: finalOrder }, columnId);

            return res.status(200).json({
                success: true,
                data: updatedColumn
            });
        } catch (error) {
            next(error);
        }
    }
}