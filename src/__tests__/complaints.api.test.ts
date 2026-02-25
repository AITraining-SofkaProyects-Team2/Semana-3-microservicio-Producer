import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

// Mock the MessagingFacade to avoid needing RabbitMQ during API tests
vi.mock('../messaging/MessagingFacade.js', () => ({
  MessagingFacade: vi.fn().mockImplementation(() => ({
    publishTicketCreated: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock the RabbitMQConnectionManager to prevent real connections
vi.mock('../messaging/RabbitMQConnectionManager.js', () => ({
  RabbitMQConnectionManager: {
    getInstance: vi.fn().mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      getChannel: vi.fn().mockReturnValue(null),
      isConnected: vi.fn().mockReturnValue(false),
    }),
    resetInstance: vi.fn(),
  },
}));

describe('POST /complaints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rechaza requests incompletos (sin lineNumber)', async () => {
    const res = await request(app)
      .post('/complaints')
      .send({
        email: 'a@b.com',
        incidentType: 'NO_SERVICE',
      })
      .expect(400);

    expect(res.body.error).toBe('Validation Error');
    expect(res.body.details).toMatch(/lineNumber/);
  });

  it('rechaza requests sin email válido', async () => {
    const res = await request(app)
      .post('/complaints')
      .send({
        lineNumber: '099123456',
        email: 'not-an-email',
        incidentType: 'NO_SERVICE',
      })
      .expect(400);

    expect(res.body.error).toBe('Validation Error');
  });

  it('rechaza requests sin incidentType', async () => {
    const res = await request(app)
      .post('/complaints')
      .send({
        lineNumber: '099123456',
        email: 'a@b.com',
      })
      .expect(400);

    expect(res.body.error).toBe('Validation Error');
  });

  it('rechaza OTHER sin description', async () => {
    const res = await request(app)
      .post('/complaints')
      .send({
        lineNumber: '099123456',
        email: 'a@b.com',
        incidentType: 'OTHER',
      })
      .expect(400);

    expect(res.body.error).toBe('Validation Error');
    expect(res.body.details).toMatch(/description|OTHER/);
  });

  it('devuelve 201 con ticketId y status RECEIVED', async () => {
    const res = await request(app)
      .post('/complaints')
      .send({
        lineNumber: '099123456',
        email: 'user@example.com',
        incidentType: 'NO_SERVICE',
      })
      .expect(201);

    expect(res.body).toHaveProperty('ticketId');
    expect(res.body).toHaveProperty('status', 'RECEIVED');
    expect(typeof res.body.ticketId).toBe('string');
  });

  it('responde rápido sin esperar al worker (solo publica evento)', async () => {
    const res = await request(app)
      .post('/complaints')
      .send({
        lineNumber: '099123456',
        email: 'u@e.com',
        incidentType: 'SLOW_CONNECTION',
      })
      .expect(201);

    expect(res.body.status).toBe('RECEIVED');
    expect(res.body.priority).toBe('PENDING');
  });

  it('acepta OTHER con description', async () => {
    const res = await request(app)
      .post('/complaints')
      .send({
        lineNumber: '099123456',
        email: 'a@b.com',
        incidentType: 'OTHER',
        description: 'Problema no listado',
      })
      .expect(201);

    expect(res.body.ticketId).toBeDefined();
    expect(res.body.status).toBe('RECEIVED');
  });
});

describe('GET /complaints/:ticketId', () => {
  it('devuelve 404 (endpoint eliminado — persistencia delegada al Consumer)', async () => {
    await request(app)
      .get('/complaints/any-id')
      .expect(404);
  });
});
