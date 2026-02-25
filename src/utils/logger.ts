import { serverConfig } from '../config/index.js';
import type { ILogger } from './ILogger.js';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMessage {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

const formatLog = (log: LogMessage): string => {
  const contextStr = log.context ? ` ${JSON.stringify(log.context)}` : '';
  return `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}${contextStr}`;
};

const createLogEntry = (level: LogLevel, message: string, context?: Record<string, unknown>): LogMessage => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  context,
});

export const logger: ILogger = {
  info: (message: string, context?: Record<string, unknown>): void => {
    console.log(formatLog(createLogEntry('info', message, context)));
  },

  warn: (message: string, context?: Record<string, unknown>): void => {
    console.warn(formatLog(createLogEntry('warn', message, context)));
  },

  error: (message: string, context?: Record<string, unknown>): void => {
    console.error(formatLog(createLogEntry('error', message, context)));
  },

  debug: (message: string, context?: Record<string, unknown>): void => {
    if (serverConfig.nodeEnv === 'development') {
      console.debug(formatLog(createLogEntry('debug', message, context)));
    }
  },
};
