import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    issuer: 'omeganexora-api',
    audience: 'omeganexora-client'
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret, {
    issuer: 'omeganexora-api',
    audience: 'omeganexora-client'
  });
}
