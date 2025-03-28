import { Request, Response } from 'express';
import { TaskService } from './task.service';
import { TaskSchema } from './task.dto';
import { ZodError } from 'zod';
import createHttpError from 'http-errors';

export class TaskController {
  constructor(private taskService: TaskService) {}

  getAllTasks = async (req: Request, res: Response): Promise<void> => {
    const tasks = await this.taskService.getAll(req.paginationParams);
    res.json(tasks);
  };

  getTaskById = async (req: Request, res: Response): Promise<void> => {
    const task = await this.taskService.getById(req.params.id);

    if (!task) {
      throw createHttpError(404, 'Task not found');
    }

    res.json(task);
  };

  createTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedTask = TaskSchema.parse(req.body);
      const newTask = await this.taskService.create(validatedTask);

      res.status(201).json(newTask);
    } catch (error) {
      if (error instanceof ZodError) {
        throw createHttpError(400, 'Validation Error', { validationError: error });
      }

      throw createHttpError(500, 'Error creating task', { error });
    }
  };

  updateTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedTask = TaskSchema.partial().parse(req.body);

      if (validatedTask.id && validatedTask.id !== req.params.id) {
        throw createHttpError.BadRequest('Id in the path param and body does not matched');
      }

      const updatedTask = await this.taskService.update(req.params.id, validatedTask);

      res.json(updatedTask);
    } catch (error) {
      if (error instanceof ZodError) {
        throw createHttpError(400, 'Validation Error', { validationError: error });
      }

      if (createHttpError.isHttpError(error)) {
        throw error;
      }

      throw createHttpError(500, 'Error creating task', { error });
    }
  };

  deleteTask = async (req: Request, res: Response): Promise<void> => {
    await this.taskService.delete(req.params.id);

    res.status(204).send();
  };
}
