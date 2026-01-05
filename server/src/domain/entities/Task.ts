export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  column_id: string;
  board_id: string;
  title: string;
  description?: string;
  priority: Priority;
  assignee_id?: string; // Single assignee as per MVP
  order: number;
  created_at: Date;
}