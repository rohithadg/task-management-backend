import { v4 as uuidv4 } from 'uuid';
import { Task } from './task.interfaces';
import { PaginatedRequest, PaginatedResponse } from '../commons';
import { DynamoDbService } from '../aws';

export class TaskService {
  private taskTable: string;
  private taskPartitionKey: string;

  constructor(private dynamoDbService: DynamoDbService) {
    this.taskTable = process.env.TASK_TABLE || 'TasksTable';
    this.taskPartitionKey = process.env.TASK_PARTITION_KEY || 'id';
  }

  async getAll(options?: PaginatedRequest): Promise<PaginatedResponse<Task>> {
    const items = await this.dynamoDbService.paginatedScan<Task>(
      this.taskTable,
      this.taskPartitionKey,
      options,
    );

    return {
      items: items.items,
      lastKey: items.lastEvaluatedKey?.[this.taskPartitionKey],
    };
  }

  async getById(id: string): Promise<Task | undefined> {
    return this.dynamoDbService.getItemById<Task>(this.taskTable, id);
  }

  async create(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const newTask: Task = {
      id: uuidv4(),
      ...taskData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.dynamoDbService.putItem(this.taskTable, newTask);

    return this.dynamoDbService.getItemById<Task>(this.taskTable, newTask.id);
  }

  async update(id: string, taskData: Partial<Task>): Promise<Task> {
    taskData.id = id;
    taskData.updatedAt = new Date().toISOString();
    await this.dynamoDbService.putItem(this.taskTable, taskData);

    return this.dynamoDbService.getItemById<Task>(this.taskTable, id);
  }

  async delete(id: string): Promise<void> {
    return this.dynamoDbService.deleteItem(this.taskTable, id);
  }
}
