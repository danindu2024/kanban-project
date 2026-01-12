import { Column } from '../entities/Column';

export interface IColumnRepository {
  create(columnData: 
    { board_id: string; 
      title: string; 
      order: number;}): Promise<Column>;

  findByBoardId(boardId: string): Promise<Column[]>;
  update(columnId: string, title: string): Promise<Column | null>;
  findById(id: string): Promise<Column | null>;
  delete(id: string): Promise<Boolean>;
  moveColumn(id: string, newOrder: number): Promise<void>
}