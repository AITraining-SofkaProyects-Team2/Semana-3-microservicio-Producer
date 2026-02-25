import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IncidentType } from '../types/ticket.types.js';
import type { IMessagingFacade } from '../messaging/IMessagingFacade.js';
import { createComplaintsService } from './complaints.service.js';

// Mock IMessagingFacade
const mockMessaging: IMessagingFacade = {
  publishTicketCreated: vi.fn().mockResolvedValue(undefined),
};

describe('complaintsService', () => {
  const validRequest = {
    lineNumber: '099123456',
    email: 'user@example.com',
    incidentType: IncidentType.NO_SERVICE,
  };

  const complaintsService = createComplaintsService(mockMessaging);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTicket', () => {
    it('construye ticket con status RECEIVED y priority PENDING', async () => {
      const ticket = await complaintsService.createTicket(validRequest);

      expect(ticket.status).toBe('RECEIVED');
      expect(ticket.priority).toBe('PENDING');
      expect(ticket.ticketId).toBeDefined();
      expect(typeof ticket.ticketId).toBe('string');
    });

    it('siempre devuelve ticketId', async () => {
      const ticket = await complaintsService.createTicket(validRequest);
      expect(ticket.ticketId).toBeDefined();
      expect(ticket.ticketId.length).toBeGreaterThan(0);
    });

    it('publica evento via IMessagingFacade', async () => {
      const ticket = await complaintsService.createTicket(validRequest);

      expect(mockMessaging.publishTicketCreated).toHaveBeenCalledTimes(1);
      const publishedTicket = vi.mocked(mockMessaging.publishTicketCreated).mock.calls[0][0];
      expect(publishedTicket.ticketId).toBe(ticket.ticketId);
      expect(publishedTicket.lineNumber).toBe(validRequest.lineNumber);
      expect(publishedTicket.incidentType).toBe(validRequest.incidentType);
    });

    it('NO persiste el ticket (persistencia es responsabilidad del Consumer)', async () => {
      // Producer solo genera eventos — no persiste
      const ticket = await complaintsService.createTicket(validRequest);
      expect(ticket).toBeDefined();
      // No hay repositorio en el Producer, solo se verifica que se publicó
      expect(mockMessaging.publishTicketCreated).toHaveBeenCalledTimes(1);
    });

    // Validation tests moved to validateComplaintRequest.test.ts (SRP §3.1)

    it('asigna description null cuando no se provee', async () => {
      const ticket = await complaintsService.createTicket(validRequest);
      expect(ticket.description).toBeNull();
    });

    it('preserva description cuando se provee', async () => {
      const ticket = await complaintsService.createTicket({
        ...validRequest,
        description: 'Test description',
      });
      expect(ticket.description).toBe('Test description');
    });
  });
});
