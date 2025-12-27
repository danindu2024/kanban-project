import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { Task, Priority } from '../../domain/entities/Task';

interface CreateTaskRequest {
  boardId: string;
  columnId: string;
  title: string;
  priority: Priority;
  description?: string;
}

export class CreateTask {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(request: CreateTaskRequest): Promise<Task> {
    // Logic: New tasks usually go to the bottom of a column.
    // In a full implementation, you'd fetch the current max order first.
    const newTask = await this.taskRepository.create({
      ...request,
      order: 0, // Simplified for now; infrastructure will handle positioning
      createdAt: new Date(),
    });

    return newTask;
  }
}