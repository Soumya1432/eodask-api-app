import type { Response } from 'express';
import { taskService } from '../services/task.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import type { AuthRequest } from '../types/index.js';
import type { TaskStatus, TaskPriority } from '@prisma/client';

export const createTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { projectId } = req.params;
  const task = await taskService.create(req.user!.id, { ...req.body, projectId });
  sendSuccess(res, 'Task created', task, 201);
});

export const getTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { projectId } = req.params;
  const {
    status,
    priority,
    assigneeId,
    search,
    page = '1',
    limit = '50',
  } = req.query;

  const { tasks, total } = await taskService.findAll(projectId, {
    status: status as TaskStatus | undefined,
    priority: priority as TaskPriority | undefined,
    assigneeId: assigneeId as string | undefined,
    search: search as string | undefined,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  });

  sendPaginated(res, 'Tasks retrieved', tasks, {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    total,
  });
});

export const getTasksByColumn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tasks = await taskService.findByColumn(req.params.columnId);
  sendSuccess(res, 'Tasks retrieved', tasks);
});

export const getTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await taskService.findById(req.params.taskId);
  sendSuccess(res, 'Task retrieved', task);
});

export const updateTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await taskService.update(req.params.taskId, req.user!.id, req.body);
  sendSuccess(res, 'Task updated', task);
});

export const deleteTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  await taskService.delete(req.params.taskId, req.user!.id);
  sendSuccess(res, 'Task deleted');
});

export const moveTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { columnId, order } = req.body;
  const task = await taskService.moveTask(
    req.params.taskId,
    req.user!.id,
    columnId,
    order
  );
  sendSuccess(res, 'Task moved', task);
});

export const assignUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.body;
  const task = await taskService.assignUser(req.params.taskId, req.user!.id, userId);
  sendSuccess(res, 'User assigned', task);
});

export const unassignUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const task = await taskService.unassignUser(req.params.taskId, req.user!.id, userId);
  sendSuccess(res, 'User unassigned', task);
});

export const addComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { content, parentId } = req.body;
  const comment = await taskService.addComment(
    req.params.taskId,
    req.user!.id,
    content,
    parentId
  );
  sendSuccess(res, 'Comment added', comment, 201);
});

export const updateComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  const comment = await taskService.updateComment(
    req.params.commentId,
    req.user!.id,
    content
  );
  sendSuccess(res, 'Comment updated', comment);
});

export const deleteComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  await taskService.deleteComment(req.params.commentId, req.user!.id);
  sendSuccess(res, 'Comment deleted');
});

// Aliases for route compatibility
export const addAssignee = assignUser;
export const removeAssignee = unassignUser;

export const getComments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const comments = await taskService.getComments(req.params.taskId);
  sendSuccess(res, 'Comments retrieved', comments);
});

export const getActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const activity = await taskService.getActivity(req.params.taskId);
  sendSuccess(res, 'Activity retrieved', activity);
});
