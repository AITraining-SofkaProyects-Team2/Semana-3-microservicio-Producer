import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createComplaintsService } from '../src/services/complaints.service.js';
import { complaintsController } from '../src/controllers/complaints.controller.js';
import { IncidentType } from '../src/types/ticket.types.js';
import { RabbitMQConnectionManager } from '../src/messaging/RabbitMQConnectionManager.js';
import { Request, Response } from 'express';

// Mock dependencies
vi.mock('../src/messaging/RabbitMQConnectionManager.js', () => ({
    RabbitMQConnectionManager: {
        getInstance: vi.fn(),
    },
}));

vi.mock('../src/utils/logger.js', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
}));

// Mock the service module instance but keep the factory
vi.mock('../src/services/complaints.service.js', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        complaintsService: {
            createTicket: vi.fn(),
        },
    };
});

describe('Producer — Unit Tests', () => {
    const mockIsConnected = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(RabbitMQConnectionManager.getInstance).mockReturnValue({
            isConnected: mockIsConnected,
        } as any);
        mockIsConnected.mockReturnValue(true);
    });

    describe('ComplaintsService — Business Logic', () => {
        const mockMessaging = {
            publishTicketCreated: vi.fn().mockResolvedValue(undefined),
        };
        // Use the real factory with a mock messaging facade
        const service = createComplaintsService(mockMessaging as any);

        it('Given a valid request, When creating a ticket, Then it should return a ticket with status RECEIVED', async () => {
            const request = {
                lineNumber: '099123456',
                email: 'test@example.com',
                incidentType: IncidentType.NO_SERVICE,
            };

            const ticket = await service.createTicket(request);

            expect(ticket.status).toBe('RECEIVED');
            expect(ticket.priority).toBe('PENDING');
            expect(mockMessaging.publishTicketCreated).toHaveBeenCalled();
        });

        it('Given the messaging broker is down, When creating a ticket, Then it should throw a MessagingError', async () => {
            mockIsConnected.mockReturnValue(false);
            const request = {
                lineNumber: '099123456',
                email: 'test@example.com',
                incidentType: IncidentType.NO_SERVICE,
            };

            await expect(service.createTicket(request)).rejects.toThrow('Canal de mensajería no disponible');
        });
    });

    describe('ComplaintsController — Interface', () => {
        it('Given a valid request, When createComplaint is called, Then it should return 202 Accepted', async () => {
            // Get the mocked instance
            const { complaintsService } = await import('../src/services/complaints.service.js');

            const req = {
                body: {
                    lineNumber: '099123456',
                    email: 'test@example.com',
                    incidentType: IncidentType.NO_SERVICE,
                    description: 'Help!',
                }
            } as unknown as Request;

            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn().mockReturnThis(),
            } as unknown as Response;

            const next = vi.fn();

            const mockTicket = {
                ticketId: 'test-id',
                status: 'RECEIVED',
                createdAt: new Date(),
            };
            vi.mocked(complaintsService.createTicket).mockResolvedValue(mockTicket as any);

            await complaintsController.createComplaint(req, res, next);

            expect(complaintsService.createTicket).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(202);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Accepted for processing',
                status: 'RECEIVED'
            }));
        });
    });
});
