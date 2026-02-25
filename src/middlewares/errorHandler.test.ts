import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/validation.error.js';
import { MessagingError } from '../errors/messaging.error.js';
import { validationErrorHandler } from './errorHandlers/validationErrorHandler.js';
import { jsonSyntaxErrorHandler } from './errorHandlers/jsonSyntaxErrorHandler.js';
import { messagingErrorHandler } from './errorHandlers/messagingErrorHandler.js';
import { defaultErrorHandler } from './errorHandlers/defaultErrorHandler.js';

const mockRequest = {} as Request;
const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

describe('Error Handler Chain', () => {
  let mockNext: NextFunction;

  beforeEach(() => {
    mockNext = vi.fn();
  });

  describe('validationErrorHandler', () => {
    it('maneja ValidationError con status 400', () => {
      const res = createMockResponse();
      const error = new ValidationError('campo inválido');
      validationErrorHandler(error, mockRequest, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        details: 'campo inválido',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('pasa al siguiente handler si no es ValidationError', () => {
      const res = createMockResponse();
      const error = new Error('otro error');
      validationErrorHandler(error, mockRequest, res, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('jsonSyntaxErrorHandler', () => {
    it('maneja SyntaxError de JSON con status 400', () => {
      const res = createMockResponse();
      const error = new SyntaxError('Unexpected token');
      (error as unknown as Record<string, unknown>).body = 'invalid json';
      jsonSyntaxErrorHandler(error, mockRequest, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid JSON',
        details: 'The request body contains invalid JSON',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('pasa al siguiente si no es SyntaxError con body', () => {
      const res = createMockResponse();
      const error = new SyntaxError('Unexpected token');
      // No 'body' property
      jsonSyntaxErrorHandler(error, mockRequest, res, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('messagingErrorHandler', () => {
    it('maneja MessagingError con status 503', () => {
      const res = createMockResponse();
      const error = new MessagingError('canal no disponible', 'ticket-123');
      messagingErrorHandler(error, mockRequest, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Service Unavailable',
        details: 'The messaging service is temporarily unavailable',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('pasa al siguiente si no es MessagingError', () => {
      const res = createMockResponse();
      const error = new Error('otro error');
      messagingErrorHandler(error, mockRequest, res, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('defaultErrorHandler', () => {
    it('maneja cualquier error con status 500', () => {
      const res = createMockResponse();
      const error = new Error('error inesperado');
      defaultErrorHandler(error, mockRequest, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        details: 'An unexpected error occurred',
      });
    });
  });
});
