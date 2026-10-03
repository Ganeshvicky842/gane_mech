export class AppError extends Error {
  constructor(statusCode, message, code = 'APP_ERROR', details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}
