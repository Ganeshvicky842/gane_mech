import User from '../models/User.js';
import ProviderProfile from '../models/ProviderProfile.js';
import { verifyAccessToken } from '../utils/auth.js';
import { AppError, asyncHandler } from '../utils/http.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError(401, 'Authentication required', 'AUTH_REQUIRED');
  let payload;
  try { payload = verifyAccessToken(token); } catch { throw new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN'); }
  const user = await User.findById(payload.sub).select('+passwordHash');
  if (!user || !user.active) throw new AppError(401, 'Account is unavailable', 'ACCOUNT_UNAVAILABLE');
  req.user = user;
  if (user.role === 'PROVIDER') {
    const profile = await ProviderProfile.findOne({ userId: user._id });
    if (!profile) throw new AppError(403, 'Provider profile is not configured', 'PROVIDER_PROFILE_MISSING');
    req.user.providerProfileId = String(profile._id);
  }
  next();
});

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(new AppError(403, 'Insufficient permissions', 'FORBIDDEN'));
    next();
  };
}
