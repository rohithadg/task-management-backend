import { z } from 'zod';
import { TaskStatus } from './task.interfaces';

export const TaskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, { message: 'Title is required' }).max(100),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type TaskDto = z.infer<typeof TaskSchema>;
