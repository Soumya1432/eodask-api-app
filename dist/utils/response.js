export const sendResponse = (res, statusCode, data) => {
    return res.status(statusCode).json(data);
};
export const sendSuccess = (res, message, data, statusCode = 200) => {
    return sendResponse(res, statusCode, {
        success: true,
        message,
        data,
    });
};
export const sendError = (res, message, statusCode = 500, error) => {
    return sendResponse(res, statusCode, {
        success: false,
        message,
        error,
    });
};
export const sendPaginated = (res, message, data, pagination) => {
    return sendResponse(res, 200, {
        success: true,
        message,
        data,
        pagination: {
            ...pagination,
            totalPages: Math.ceil(pagination.total / pagination.limit),
        },
    });
};
//# sourceMappingURL=response.js.map