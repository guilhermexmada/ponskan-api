class APIResponse {
    constructor(res, message, statusCode = 200, data, meta) {
        return res.status(statusCode).json({
            success: true,
            status: statusCode,
            message: message,
            data: data,
            meta: meta
        })
    }
}

export default APIResponse