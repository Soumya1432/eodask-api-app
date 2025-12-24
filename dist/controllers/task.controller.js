import { taskService } from '../services/task.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
export const createTask = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const task = await taskService.create(req.user.id, { ...req.body, projectId });
    sendSuccess(res, 'Task created', task, 201);
});
export const getTasks = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { status, priority, assigneeId, search, page = '1', limit = '50', } = req.query;
    const { tasks, total } = await taskService.findAll(projectId, {
        status: status,
        priority: priority,
        assigneeId: assigneeId,
        search: search,
        page: parseInt(page),
        limit: parseInt(limit),
    });
    sendPaginated(res, 'Tasks retrieved', tasks, {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
    });
});
export const getTasksByColumn = asyncHandler(async (req, res) => {
    const tasks = await taskService.findByColumn(req.params.columnId);
    sendSuccess(res, 'Tasks retrieved', tasks);
});
export const getTask = asyncHandler(async (req, res) => {
    const task = await taskService.findById(req.params.taskId);
    sendSuccess(res, 'Task retrieved', task);
});
export const updateTask = asyncHandler(async (req, res) => {
    const task = await taskService.update(req.params.taskId, req.user.id, req.body);
    sendSuccess(res, 'Task updated', task);
});
export const deleteTask = asyncHandler(async (req, res) => {
    await taskService.delete(req.params.taskId, req.user.id);
    sendSuccess(res, 'Task deleted');
});
export const moveTask = asyncHandler(async (req, res) => {
    const { columnId, order } = req.body;
    const task = await taskService.moveTask(req.params.taskId, req.user.id, columnId, order);
    sendSuccess(res, 'Task moved', task);
});
export const assignUser = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const task = await taskService.assignUser(req.params.taskId, req.user.id, userId);
    sendSuccess(res, 'User assigned', task);
});
export const unassignUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const task = await taskService.unassignUser(req.params.taskId, req.user.id, userId);
    sendSuccess(res, 'User unassigned', task);
});
export const addComment = asyncHandler(async (req, res) => {
    const { content, parentId } = req.body;
    const comment = await taskService.addComment(req.params.taskId, req.user.id, content, parentId);
    sendSuccess(res, 'Comment added', comment, 201);
});
export const updateComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const comment = await taskService.updateComment(req.params.commentId, req.user.id, content);
    sendSuccess(res, 'Comment updated', comment);
});
export const deleteComment = asyncHandler(async (req, res) => {
    await taskService.deleteComment(req.params.commentId, req.user.id);
    sendSuccess(res, 'Comment deleted');
});
// Aliases for route compatibility
export const addAssignee = assignUser;
export const removeAssignee = unassignUser;
export const getComments = asyncHandler(async (req, res) => {
    const comments = await taskService.getComments(req.params.taskId);
    sendSuccess(res, 'Comments retrieved', comments);
});
export const getActivity = asyncHandler(async (req, res) => {
    const activity = await taskService.getActivity(req.params.taskId);
    sendSuccess(res, 'Activity retrieved', activity);
});
//# sourceMappingURL=task.controller.js.map