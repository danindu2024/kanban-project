import { Task } from "./Task";

export interface Column {
  id: string;
  board_id: string;
  title: string;
  order: number;
  tasks?: Task[];
  created_at: Date;
}