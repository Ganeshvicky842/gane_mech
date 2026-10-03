import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { verifyAccessToken } from '../utils/auth.js';
import User from '../models/User.js';
import ProviderProfile from '../models/ProviderProfile.js';
import RoadsideRequest from '../models/RoadsideRequest.js';

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.socketCorsOrigin.split(',').map(x => x.trim()), credentials: true },
    transports: ['websocket', 'polling']
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) return next(new Error('AUTH_REQUIRED'));
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub);
      if (!user?.active) return next(new Error('ACCOUNT_UNAVAILABLE'));
      if (user.role === 'PROVIDER') {
        const profile = await ProviderProfile.findOne({ userId: user._id });
        if (!profile) return next(new Error('PROVIDER_PROFILE_MISSING'));
        user.providerProfileId = String(profile._id);
      }
      socket.user = user;
      next();
    } catch { next(new Error('INVALID_TOKEN')); }
  });

  io.on('connection', socket => {
    socket.join(`user:${socket.user._id}`);
    socket.on('request:join', async (requestId, ack = () => {}) => {
      try {
        const request = await RoadsideRequest.findById(requestId);
        if (!request) return ack({ ok: false, error: 'REQUEST_NOT_FOUND' });
        const customer = String(request.customerId) === String(socket.user._id);
        const provider = socket.user.role === 'PROVIDER' && String(request.assignedProviderId) === String(socket.user.providerProfileId || '');
        if (!customer && !provider && socket.user.role !== 'ADMIN') return ack({ ok: false, error: 'FORBIDDEN' });
        socket.join(`request:${requestId}`);
        ack({ ok: true, room: `request:${requestId}` });
      } catch { ack({ ok: false, error: 'INTERNAL_ERROR' }); }
    });
    socket.on('request:leave', requestId => socket.leave(`request:${requestId}`));
  });

  return io;
}
