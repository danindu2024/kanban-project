import { IColumnRepository } from "../domain/repositories/IColumnRepository";
import { IBoardRepository } from "../domain/repositories/IBoardRepository";
import { CreateColumnUseCase } from "../use-cases/column/CreateColumn";
import { UpdateColumnUseCase } from "../use-cases/column/UpdateColumn";
import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/authMiddleware";

export class ColumnController {
    private createColumnUseCase: CreateColumnUseCase;
    private updateColumnUseCase: UpdateColumnUseCase;
    
    constructor(columnRepository: IColumnRepository, boardRepository: IBoardRepository) {
        this.createColumnUseCase = new CreateColumnUseCase(columnRepository, boardRepository);
        this.updateColumnUseCase = new UpdateColumnUseCase(columnRepository);
    }

    createColumn = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { board_id, title, order } = req.body;
            const newColumn = await this.createColumnUseCase.execute({ 
                boardId: board_id, 
                title, 
                order });

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