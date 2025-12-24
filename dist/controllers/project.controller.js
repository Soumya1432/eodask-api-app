import { projectService } from '../services/project.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
// Generate project key from name (e.g., "My Project" -> "MYPR")
const generateProjectKey = (name) => {
    const words = name.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length === 1) {
        return words[0].substring(0, 4).toUpperCase();
    }
    // Take first letter of each word, up to 4 characters
    return words
        .map(w => w[0])
        .join('')
        .substring(0, 4)
        .toUpperCase();
};
export const createProject = asyncHandler(async (req, res) => {
    // Generate key if not provided
    const key = req.body.key || generateProjectKey(req.body.name);
    const project = await projectService.create(req.user.id, { ...req.body, key });
    sendSuccess(res, 'Project created', project, 201);
});
export const getProjects = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { projects, total } = await projectService.findAll(req.user.id, page, limit);
    sendPaginated(res, 'Projects retrieved', projects, { page, limit, total });
});
export const getProject = asyncHandler(async (req, res) => {
    const project = await projectService.findById(req.params.projectId, req.user.id);
    sendSuccess(res, 'Project retrieved', project);
});
export const updateProject = asyncHandler(async (req, res) => {
    const project = await projectService.update(req.params.projectId, req.user.id, req.body);
    sendSuccess(res, 'Project updated', project);
});
export const deleteProject = asyncHandler(async (req, res) => {
    await projectService.delete(req.params.projectId, req.user.id);
    sendSuccess(res, 'Project deleted');
});
export const addMember = asyncHandler(async (req, res) => {
    const { email, role } = req.body;
    const member = await projectService.addMember(req.params.projectId, req.user.id, email, role);
    sendSuccess(res, 'Member added', member, 201);
});
export const removeMember = asyncHandler(async (req, res) => {
    await projectService.removeMember(req.params.projectId, req.user.id, req.params.userId);
    sendSuccess(res, 'Member removed');
});
export const updateMemberRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const member = await projectService.updateMemberRole(req.params.projectId, req.user.id, req.params.userId, role);
    sendSuccess(res, 'Member role updated', member);
});
export const getProjectStats = asyncHandler(async (req, res) => {
    const stats = await projectService.getStats(req.params.projectId);
    sendSuccess(res, 'Project stats retrieved', stats);
});
export const getMembers = asyncHandler(async (req, res) => {
    const members = await projectService.getMembers(req.params.projectId, req.user.id);
    sendSuccess(res, 'Members retrieved', members);
});
export const getColumns = asyncHandler(async (req, res) => {
    const columns = await projectService.getColumns(req.params.projectId, req.user.id);
    sendSuccess(res, 'Columns retrieved', columns);
});
export const createColumn = asyncHandler(async (req, res) => {
    const column = await projectService.createColumn(req.params.projectId, req.user.id, req.body);
    sendSuccess(res, 'Column created', column, 201);
});
export const updateColumn = asyncHandler(async (req, res) => {
    const column = await projectService.updateColumn(req.params.projectId, req.user.id, req.params.columnId, req.body);
    sendSuccess(res, 'Column updated', column);
});
export const deleteColumn = asyncHandler(async (req, res) => {
    await projectService.deleteColumn(req.params.projectId, req.user.id, req.params.columnId);
    sendSuccess(res, 'Column deleted');
});
export const reorderColumns = asyncHandler(async (req, res) => {
    const columns = await projectService.reorderColumns(req.params.projectId, req.user.id, req.body.columnOrders);
    sendSuccess(res, 'Columns reordered', columns);
});
//# sourceMappingURL=project.controller.js.map