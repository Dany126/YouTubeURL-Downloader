export class AppError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
export function notFound(_req, _res, next) { next(new AppError(404, 'NOT_FOUND', 'The requested endpoint was not found.')); }
export function errorHandler(error, _req, res, _next) {
  const known = error instanceof AppError;
  const status = known ? error.status : 500;
  const code = known ? error.code : 'INTERNAL_SERVER_ERROR';
  const message = known ? error.message : 'Something went wrong. Please try again.';
  if (!known) console.error('Request failed:', error?.message || error);
  res.status(status).json({ success: false, error: { code, message } });
}
