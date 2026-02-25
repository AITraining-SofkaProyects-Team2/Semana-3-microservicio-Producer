import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('expone serverConfig y rabbitmqConfig con valores por defecto', async () => {
    const { serverConfig, rabbitmqConfig } = await import('./index.js');
    expect(serverConfig.port).toBeGreaterThan(0);
    expect(serverConfig.nodeEnv).toBeDefined();
    expect(rabbitmqConfig.url).toBeDefined();
    expect(rabbitmqConfig.exchange).toBe('complaints.exchange');
    expect(rabbitmqConfig.routingKey).toBe('complaint.received');
  });

  it('usa development cuando NODE_ENV no está definido', async () => {
    delete process.env.NODE_ENV;
    vi.resetModules();
    const { serverConfig } = await import('./index.js');
    expect(serverConfig.nodeEnv).toBe('development');
  });
});
