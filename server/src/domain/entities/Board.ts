import { Column } from "./Column";
import { Task } from "./Task";

export interface Board{
  id: string;
  title: string;
  owner_id: string;
  members: string[];
  created_at: Date;
  updated_at: Date;
}

// 2. extended interface for populated columns
export interface PopulatedBoard extends Board {
  columns: PopulatedColumn[]; 
}

// helper for column to task population
export interface PopulatedColumn extends Column {
  tasks: Task[];
}