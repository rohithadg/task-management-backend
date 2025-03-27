import 'express-async-errors';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { taskRoutes } from './tasks';
import { notFoundHandler, defaultErrorHandler } from './middlewares';

const app = express();

const stageEnv = process.env.STAGE || ''; // API GW stage
const stage = stageEnv ? `/${stageEnv}` : '';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(`${stage}/tasks`, taskRoutes);

app.use(notFoundHandler);
app.use(defaultErrorHandler);

export default app;
