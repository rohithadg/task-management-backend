import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { TaskService } from './task.service';
import { DynamoDbService } from '../aws';
import { Task, TaskStatus } from './task.interfaces';
import { PaginatedRequest } from '../commons';

jest.mock('uuid', () => ({ v4: () => 'new-task-id' }));

describe('TaskService', () => {
  let taskService: TaskService;
  let mockDynamoDbService: DeepMocked<DynamoDbService>;

  global.Date = jest.fn(() => ({
    toISOString: () => '2024-03-28T00:00:00Z',
  })) as any;

  beforeEach(() => {
    mockDynamoDbService = createMock<DynamoDbService>();
    taskService = new TaskService(mockDynamoDbService);
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('getAll', () => {
    it('should retrieve paginated tasks', async () => {
      const mockTasks: Task[] = [
        {
          id: 'task1',
          title: 'Test Task 1',
          description: 'Description 1',
          status: TaskStatus.TODO,
          createdAt: '2024-03-28T00:00:00Z',
          updatedAt: '2024-03-28T00:00:00Z',
        },
      ];

      const pagination: PaginatedRequest = { limit: 10, lastKey: 'last-key' };

      const mockPaginatedResult = {
        items: mockTasks,
        lastEvaluatedKey: { id: 'task1' },
      };

      mockDynamoDbService.paginatedScan.mockResolvedValue(mockPaginatedResult);

      const result = await taskService.getAll(pagination);

      expect(mockDynamoDbService.paginatedScan).toHaveBeenCalledWith(
        'TasksTable',
        'id',
        pagination,
      );
      expect(result.items).toEqual(mockTasks);
      expect(result.lastKey).toBe('task1');
    });
  });

  describe('getById', () => {
    it('should retrieve a task by id', async () => {
      const mockTask: Task = {
        id: 'task1',
        title: 'Test Task',
        description: 'Test Description',
        status: TaskStatus.IN_PROGRESS,
        createdAt: '2024-03-28T00:00:00Z',
        updatedAt: '2024-03-28T00:00:00Z',
      };

      mockDynamoDbService.getItemById.mockResolvedValue(mockTask);

      const result = await taskService.getById('task1');

      expect(mockDynamoDbService.getItemById).toHaveBeenCalledWith('TasksTable', 'task1');
      expect(result).toEqual(mockTask);
    });
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const newTaskData = {
        title: 'New Task',
        description: 'New Description',
        status: TaskStatus.TODO,
      };

      const mockCreatedTask: Task = {
        ...newTaskData,
        id: 'new-task-id',
        createdAt: '2024-03-28T00:00:00Z',
        updatedAt: '2024-03-28T00:00:00Z',
      };

      mockDynamoDbService.putItem.mockResolvedValue(undefined);
      mockDynamoDbService.getItemById.mockResolvedValue(mockCreatedTask);

      const result = await taskService.create(newTaskData);

      expect(mockDynamoDbService.putItem).toHaveBeenCalledWith('TasksTable', {
        ...mockCreatedTask,
      });
      expect(mockDynamoDbService.getItemById).toHaveBeenCalledWith('TasksTable', 'new-task-id');
      expect(result).toEqual(mockCreatedTask);
    });
  });

  describe('update', () => {
    it('should update an existing task', async () => {
      const taskId = 'existing-task-id';
      const updateData = {
        title: 'Updated Task Title',
        status: TaskStatus.COMPLETED,
      };

      const mockUpdatedTask: Partial<Task> = {
        id: taskId,
        title: 'Updated Task Title',
        status: TaskStatus.COMPLETED,
        updatedAt: '2024-03-28T00:00:00Z',
      };

      const originalDate = global.Date;

      mockDynamoDbService.putItem.mockResolvedValue();
      mockDynamoDbService.getItemById.mockResolvedValue(mockUpdatedTask);

      const result = await taskService.update(taskId, updateData);

      expect(mockDynamoDbService.putItem).toHaveBeenCalledWith('TasksTable', {
        ...mockUpdatedTask,
      });
      expect(mockDynamoDbService.getItemById).toHaveBeenCalledWith('TasksTable', taskId);
      expect(result).toEqual(mockUpdatedTask);
    });
  });

  describe('delete', () => {
    it('should delete a task by id', async () => {
      const taskId = 'task-to-delete';

      mockDynamoDbService.deleteItem.mockResolvedValue();

      await taskService.delete(taskId);

      expect(mockDynamoDbService.deleteItem).toHaveBeenCalledWith('TasksTable', taskId);
    });
  });
});
