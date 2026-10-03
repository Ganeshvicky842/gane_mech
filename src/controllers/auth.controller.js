import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import ProviderProfile from '../models/ProviderProfile.js';
import { signAccessToken } from '../utils/auth.js';
import { AppError, ok } from '../utils/http.js';

export async function login(req, res) {
  const user = await User.findOne({ $or: [{ email: req.body.login?.toLowerCase() }, { phone: req.body.login }] }).select('+passwordHash');
  if (!user || !user.passwordHash || !(await user.comparePassword(req.body.password))) throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  const token = signAccessToken(user);
  let providerProfileId = null;
  if (user.role === 'PROVIDER') {
    const profile = await ProviderProfile.findOne({ userId: user._id });
    providerProfileId = profile?._id || null;
  }
  return ok(res, { accessToken: token, user: { id: user._id, name: user.name, role: user.role, providerProfileId } });
}
