import { Task } from '../entities/Task';
import { Priority } from '../entities/Task';

export interface ITaskRepository {
  create(taskData: 
    { column_id: string; 
      board_id: string; 
      title: string; 
      description?: string; 
      priority: Priority; 
      assignee_id?: string; 
      order: number }): Promise<Task>;

  findByColumnId(columnId: string): Promise<Task[]>;
  findByBoardId(boardId: string): Promise<Task[]>;
  update(taskId: string, updatesData: Partial<Omit<Task, 'id' | 'board_id' | 'column_id'>>): Promise<Task | null>;
  delete(taskId: string): Promise<boolean>;

  // Handles moving between columns and reordering
  moveTask(taskId: string, targetColumnId: string, newOrder: number): Promise<void>;
}