import { Column } from '../entities/Column';

export interface IColumnRepository {
  create(column: Partial<Column>): Promise<Column>;
  findByBoardId(boardId: string): Promise<Column[]>;
  updateOrder(columnId: string, newOrder: number): Promise<void>;
  findById(id: string): Promise<Column | null>;
}