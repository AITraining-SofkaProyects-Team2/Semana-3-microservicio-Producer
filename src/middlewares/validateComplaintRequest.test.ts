import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { validateComplaintRequest } from './validateComplaintRequest.js';
import { ValidationError } from '../errors/validation.error.js';
import { IncidentType } from '../types/ticket.types.js';

const createMockReq = (body: Record<string, unknown>): Partial<Request> => ({
  body,
});

describe('validateComplaintRequest middleware', () => {
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRes = {};
    mockNext = vi.fn();
  });

  const validBody = {
    lineNumber: '099123456',
    email: 'user@example.com',
    incidentType: IncidentType.NO_SERVICE,
  };

  it('llama next() con request válido', () => {
    const req = createMockReq(validBody);
    validateComplaintRequest(req as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('lanza ValidationError sin lineNumber', () => {
    const req = createMockReq({ ...validBody, lineNumber: '' });
    expect(() =>
      validateComplaintRequest(req as Request, mockRes as Response, mockNext)
    ).toThrow(ValidationError);
    expect(() =>
      validateComplaintRequest(req as Request, mockRes as Response, mockNext)
    ).toThrow(/lineNumber/);
  });

  it('lanza ValidationError sin email válido', () => {
    const req = createMockReq({ ...validBody, email: 'invalid' });
    expect(() =>
      validateComplaintRequest(req as Request, mockRes as Response, mockNext)
    ).toThrow(ValidationError);
  });

  it('lanza ValidationError con email vacío', () => {
    const req = createMockReq({ ...validBody, email: '' });
    expect(() =>
      validateComplaintRequest(req as Request, mockRes as Response, mockNext)
    ).toThrow(/email/);
  });

  it('lanza ValidationError sin incidentType válido', () => {
    const req = createMockReq({ ...validBody, incidentType: 'INVALID_TYPE' });
    expect(() =>
      validateComplaintRequest(req as Request, mockRes as Response, mockNext)
    ).toThrow(/incidentType/);
  });

  it('lanza ValidationError sin incidentType', () => {
    const req = createMockReq({ ...validBody, incidentType: '' });
    expect(() =>
      validateComplaintRequest(req as Request, mockRes as Response, mockNext)
    ).toThrow(/incidentType/);
  });

  it('exige description cuando incidentType es OTHER', () => {
    const req = createMockReq({
      ...validBody,
      incidentType: IncidentType.OTHER,
      description: '',
    });
    expect(() =>
      validateComplaintRequest(req as Request, mockRes as Response, mockNext)
    ).toThrow(/description/);
  });

  it('acepta OTHER con description', () => {
    const req = createMockReq({
      ...validBody,
      incidentType: IncidentType.OTHER,
      description: 'Detalle del problema',
    });
    validateComplaintRequest(req as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });
});
