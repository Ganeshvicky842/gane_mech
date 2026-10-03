import http from 'http';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initSocket } from './socket/index.js';

await connectDB();
const app = createApp();
const server = http.createServer(app);
const io = initSocket(server);
app.set('io', io);

server.listen(env.port, () => console.log(`OmegaNexora Team 3 API listening on http://localhost:${env.port}`));

async function shutdown(signal) {
  console.log(`${signal}: shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
