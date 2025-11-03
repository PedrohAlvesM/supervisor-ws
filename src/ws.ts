import { Server } from 'socket.io';
import { connectRedis, redisStore } from '@config/redis';
import dotenv from 'dotenv';
import { LogController } from '@controller/log.controller';
import { readFileSync } from 'fs';
import { createServer } from 'https';
import registerEvents from '@events/index';
import createSocketServer from '@config/socket';

dotenv.config();

const PORT = Number(process.env.WS_SERVER_PORT) || 3002;

const httpsOptions = {
  // key: readFileSync('/usr/src/app/crt/server.key'), //container path
  // cert: readFileSync('/usr/src/app/crt/server.crt'), //container path
};

const httpsServer = createServer(httpsOptions);
const io = createSocketServer(httpsServer);
LogController.LogEvent('WS Server', `Server running on ${process.env.SERVER_HOST}:${process.env.WS_SERVER_PORT}`);

connectRedis();

httpsServer.listen(PORT), () => {
  LogController.LogEvent('Socket.io server', `Socket.io HTTPS Server running at ${process.env.SERVER_HOST}:${PORT}`);
};