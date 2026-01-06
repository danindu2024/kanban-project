import { Column } from '../entities/Column';

export interface IColumnRepository {
  create(columnData: 
    { board_id: string; 
      title: string; 
      order: number;}): Promise<Column>;

  findByBoardId(boardId: string): Promise<Column[]>;
  update(columnId: string, updateData: Partial<Column>): Promise<Column | null>;
  findById(id: string): Promise<Column | null>;
}