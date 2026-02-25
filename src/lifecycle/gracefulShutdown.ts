import type { IConnectionManager } from '../messaging/IConnectionManager.js';
import type { ILogger } from '../utils/ILogger.js';
import { logger as defaultLogger } from '../utils/logger.js';

/**
 * Registers process signal handlers for graceful shutdown (SRP §3.1).
 * Closes the broker connection before exiting.
 */
export const registerGracefulShutdown = (
  connectionManager: IConnectionManager,
  logger: ILogger = defaultLogger
): void => {
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    await connectionManager.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};
