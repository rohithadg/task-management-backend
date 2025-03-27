import { Router } from 'express';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { dynamoDbDocClient, DynamoDbService } from '../aws';

export const taskRoutes = Router();

const dynamoDbService = new DynamoDbService(dynamoDbDocClient);
const taskService = new TaskService(dynamoDbService);
const taskController = new TaskController(taskService);

taskRoutes.get('/', taskController.getAllTasks);
taskRoutes.get('/:id', taskController.getTaskById);
taskRoutes.post('/', taskController.createTask);
taskRoutes.put('/:id', taskController.updateTask);
taskRoutes.delete('/:id', taskController.deleteTask);
