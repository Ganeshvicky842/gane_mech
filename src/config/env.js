import 'dotenv/config';

const required = ['JWT_SECRET', 'REFRESH_TOKEN_SECRET'];
for (const key of required) {
  if (!process.env[key] && process.env.NODE_ENV === 'production') {
    throw new Error(`${key} is required in production`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/omeganexora',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-this-secret-1234567890',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'dev-only-refresh-secret-1234567890',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  socketCorsOrigin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
  locationMinIntervalMs: Number(process.env.LOCATION_UPDATE_MIN_INTERVAL_MS || 3000),
  locationMaxAccuracyMeters: Number(process.env.LOCATION_MAX_ACCURACY_METERS || 100),
  matchRadiusKm: Number(process.env.MATCH_RADIUS_KM || 10),
  matchMaxResults: Number(process.env.MATCH_MAX_RESULTS || 10),
  etaSpeedKmph: Number(process.env.ETA_SPEED_KMPH || 24)
};
