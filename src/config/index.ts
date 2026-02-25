import dotenv from 'dotenv';

dotenv.config();

// Segregated configuration by module (ISP §3.4)

export const serverConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;

export const rabbitmqConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  exchange: process.env.RABBITMQ_EXCHANGE || 'complaints.exchange',
  routingKey: process.env.RABBITMQ_ROUTING_KEY || 'complaint.received',
} as const;
