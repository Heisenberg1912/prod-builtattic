import winston from 'winston';
import morgan from 'morgan';

const serviceName = process.env.SERVICE_NAME || 'builtattic-server';
const isProduction = process.env.NODE_ENV === 'production';
const logLevel =
  process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

const consoleFormat = isProduction
  ? winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    )
  : winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
        const base = `[${timestamp}] ${level}: ${message}`;
        const metaString = Object.keys(meta).length
          ? ` ${JSON.stringify(meta)}`
          : '';
        return stack ? `${base}\n${stack}${metaString}` : `${base}${metaString}`;
      })
    );

const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: { service: serviceName },
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

export const requestLogger = morgan((tokens, req, res) => {
  const traceHeader = req.headers['x-cloud-trace-context'];
  const trace =
    typeof traceHeader === 'string' ? traceHeader.split('/')[0] : undefined;

  return JSON.stringify({
    httpRequest: {
      requestMethod: tokens.method(req, res),
      requestUrl: tokens.url(req, res),
      status: Number(tokens.status(req, res)),
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer,
      latency: Number(tokens['response-time'](req, res)),
      responseSize: tokens.res(req, res, 'content-length'),
      remoteIp: req.ip,
    },
    severity: 'INFO',
    trace,
    message: 'HTTP request completed',
  });
}, {
  stream: {
    write: (message) => {
      try {
        const parsed = JSON.parse(message);
        logger.info(parsed.message, parsed);
      } catch (error) {
        logger.info(message.trim());
      }
    },
  },
});

export default logger;
