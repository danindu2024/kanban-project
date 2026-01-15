import { Task } from '../entities/Task';
import { Priority } from '../entities/Task';

export interface ITaskRepository {
  create(taskData: 
    { column_id: string; 
      board_id: string; 
      title: string; 
      description?: string; 
      priority: Priority; 
      assignee_id?: string | null;
    }): Promise<Task>;

  findByColumnId(columnId: string): Promise<Task[]>;
  findByBoardId(boardId: string): Promise<Task[]>;
  
  update(taskId: string, 
    updatesData: {
      title: string, 
      description?: string, 
      priority: Priority, 
      assignee_id?: string | null}): Promise<Task | null>;

  delete(taskId: string): Promise<boolean>;
  findById(taskId: string): Promise<Task | null>;

  // Handles moving between columns and reordering
  moveTask(taskId: string, targetColumnId: string, newOrder: number): Promise<void>;
  countTasks(columnId: string): Promise<number>
  unassignUserFromBoard(boardId: string, userId: string): Promise<void>
}