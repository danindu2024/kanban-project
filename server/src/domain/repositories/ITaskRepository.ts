import { Task } from '../entities/Task';

export interface ITaskRepository {
  create(task: Partial<Task>): Promise<Task>;
  findByColumnId(columnId: string): Promise<Task[]>;
  update(taskId: string, updates: Partial<Task>): Promise<Task | null>;
  delete(taskId: string): Promise<boolean>;
  // Handles moving between columns and reordering
  moveTask(taskId: string, targetColumnId: string, newOrder: number): Promise<void>;
}