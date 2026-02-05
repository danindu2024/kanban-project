// Define the values as a constant "tuple"
export const VALID_PRIORITIES = ['low', 'medium', 'high'] as const;

// Derive the type automatically from the array
// This is equivalent to: type Priority = 'low' | 'medium' | 'high';
export type Priority = typeof VALID_PRIORITIES[number];

export interface Task {
  id: string;
  column_id: string;
  board_id: string;
  title: string;
  description?: string;
  priority: Priority;
  assignee_id?: string | null; // Single assignee as per MVP
  order: number;
  created_at: Date;
  updated_at: Date;
}