import { AppError } from '../utils/http.js';

export function validate(schema, target = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return next(new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.issues));
    }
    req[target] = result.data;
    next();
  };
}
