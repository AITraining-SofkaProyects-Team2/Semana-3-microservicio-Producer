import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../config/index.js', () => ({
  serverConfig: { nodeEnv: 'test' },
}));

describe('logger', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('info formatea y llama console.log', async () => {
    const { logger } = await import('./logger.js');
    logger.info('test message', { key: 'value' });
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toMatch(/INFO.*test message/);
    expect(logSpy.mock.calls[0][0]).toContain('"key":"value"');
  });

  it('info sin context no incluye JSON extra', async () => {
    const { logger } = await import('./logger.js');
    logger.info('hello');
    expect(logSpy.mock.calls[0][0]).toMatch(/hello$/);
  });

  it('warn formatea y llama console.warn', async () => {
    const { logger } = await import('./logger.js');
    logger.warn('warning', { code: 1 });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(/WARN.*warning/);
  });

  it('error formatea y llama console.error', async () => {
    const { logger } = await import('./logger.js');
    logger.error('error', { err: 'detail' });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toMatch(/ERROR.*error/);
  });

  it('debug no llama console en nodeEnv test', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const { logger } = await import('./logger.js');
    logger.debug('debug msg');
    expect(debugSpy).not.toHaveBeenCalled();
    debugSpy.mockRestore();
  });
});

describe('logger (development)', () => {
  it('debug llama console.debug cuando nodeEnv es development', async () => {
    vi.resetModules();
    vi.doMock('../config/index.js', () => ({ serverConfig: { nodeEnv: 'development' as const } }));
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const { logger } = await import('./logger.js');
    logger.debug('dev message', { foo: 'bar' });
    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(debugSpy.mock.calls[0][0]).toMatch(/DEBUG.*dev message/);
    debugSpy.mockRestore();
  });
});
