import { Column } from '../entities/Column';

export interface IColumnRepository {
  // create column
  create(columnData: 
    { 
      board_id: string; 
      title: string; 
    }
  ): Promise<Column>;

  findByBoardId(boardId: string): Promise<Column[]>;
  update(columnId: string, title: string): Promise<Column | null>;
  findById(id: string): Promise<Column | null>;
  delete(id: string): Promise<Boolean>;
  moveColumn(id: string, newOrder: number): Promise<void>
  countColumn(boradId: string): Promise<number>
}