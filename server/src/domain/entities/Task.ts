export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  columnId: string;
  boardId: string;
  title: string;
  description?: string;
  priority: Priority;
  assigneeId?: string; // Single assignee as per MVP
  order: number;
  createdAt: Date;
}