import pino from 'pino';

const level = process.env.LOG_LEVEL ?? 'info';
const isDev = process.env.NODE_ENV !== 'production';

const fileTarget = {
  target: 'pino-roll',
  level,
  options: {
    file: 'logs/app.log',
    frequency: 'daily',
    mkdir: true,
    dateFormat: 'yyyy-MM-dd',
    extension: '.log',
  },
};

const stdoutTarget = isDev
  ? {
      target: 'pino-pretty',
      level,
      options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
    }
  : { target: 'pino/file', level, options: { destination: 1 } };

export const logger = pino({
  level,
  base: { service: 'viridian-backend' },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: { targets: [fileTarget, stdoutTarget] },
});
