import express from 'express';
import cors from 'cors';
import { serverConfig } from './config/index.js';
import { corsOptions } from './config/cors.config.js';
import { logger } from './utils/logger.js';
import { RabbitMQConnectionManager } from './messaging/RabbitMQConnectionManager.js';
import { complaintsRouter } from './routes/complaints.routes.js';
import { errorHandlerChain } from './middlewares/errorHandler.js';
import { registerGracefulShutdown } from './lifecycle/gracefulShutdown.js';
import { metrics } from './utils/metrics.js';

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/complaints', complaintsRouter);

// Health check endpoint (§5.2)
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    metrics: metrics.getSnapshot(),
  });
});

// Error handling middleware (must be last)
errorHandlerChain.forEach((handler) => app.use(handler));

// Singleton connection manager
const connectionManager = RabbitMQConnectionManager.getInstance();

// Graceful shutdown (extracted to lifecycle module — SRP §3.1)
registerGracefulShutdown(connectionManager);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to RabbitMQ via Singleton
    await connectionManager.connect();

    // Start Express server
    app.listen(serverConfig.port, () => {
      logger.info(`Producer service started`, {
        port: serverConfig.port,
        environment: serverConfig.nodeEnv,
      });
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to start server', { error: errorMessage });
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app };
