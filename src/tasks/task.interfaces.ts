export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedTasks {
  tasks: Task[];
  lastEvaluatedKey?: string;
}

export interface PaginatedRequest {
  limit: number;
  lastEvaluatedKey?: string;
}
