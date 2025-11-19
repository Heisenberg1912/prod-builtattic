import winston from 'winston';
import morgan from 'morgan';

import { getRequestContext } from './requestContext.js';

const serviceName = process.env.SERVICE_NAME || 'builtattic-server';
const isProduction = process.env.NODE_ENV === 'production';
const logLevel =
  process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

const contextFormat = winston.format((info) => {
  const context = getRequestContext();
  if (context && Object.keys(context).length > 0) {
    const payload = {
      requestId: context.requestId,
      route: context.route,
      method: context.method,
      statusCode: context.statusCode,
      userId: context.userId,
    };
    info.context = { ...(info.context || {}), ...payload };
    if (payload.requestId && !info.requestId) {
      info.requestId = payload.requestId;
    }
  }
  return info;
});

const consoleFormat = isProduction
  ? winston.format.combine(
      contextFormat(),
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    )
  : winston.format.combine(
      contextFormat(),
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(({ level, message, timestamp, stack, context = {}, ...meta }) => {
        const base = `[${timestamp}] ${level}: ${message}`;
        const contextString = Object.keys(context).length ? ` ${JSON.stringify(context)}` : '';
        const metaPayload = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        const suffix = `${contextString}${metaPayload}`.trim();
        const details = suffix ? ` ${suffix}` : '';
        return stack ? `${base}\n${stack}${details}` : `${base}${details}`;
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

const resolveRouteLabel = (req) => {
  if (!req) return 'unknown';
  if (req.telemetryRoute) return req.telemetryRoute;
  if (req.baseUrl && req.route?.path) {
    return `${req.baseUrl}${req.route.path}`;
  }
  return req.originalUrl || req.url || 'unknown';
};

export const requestLogger = morgan((tokens, req, res) => {
  const traceHeader = req.headers['x-cloud-trace-context'];
  const trace =
    typeof traceHeader === 'string' ? traceHeader.split('/')[0] : undefined;
  const route = resolveRouteLabel(req);
  const latencyMs = Number(tokens['response-time'](req, res)) || 0;

  return JSON.stringify({
    httpRequest: {
      requestMethod: tokens.method(req, res),
      requestUrl: tokens.url(req, res),
      status: Number(tokens.status(req, res)),
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer,
      latency: latencyMs / 1000,
      responseSize: tokens.res(req, res, 'content-length'),
      remoteIp: req.ip,
      route,
    },
    severity: 'INFO',
    trace,
    requestId: req.requestId,
    route,
    userId: req.user?._id ? String(req.user._id) : undefined,
    latencyMs,
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
