import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MessageService, MessageResponse } from './message.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('MessageService', () => {
  let service: MessageService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(MessageService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('getMessages', () => {
    it('sends GET with familyEmail as query parameter', () => {
      service.getMessages('test@family.com').subscribe();

      const req = httpTesting.expectOne('/api/messages?familyEmail=test@family.com');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('returns messages from the backend', () => {
      const mockMessages: MessageResponse[] = [
        {
          id: 1,
          content: 'Hej!',
          timestamp: '2026-03-28T10:00:00',
          username: 'Anders',
          userId: 1,
          imageId: 1,
        },
        {
          id: 2,
          content: 'Godmorgen',
          timestamp: '2026-03-28T10:05:00',
          username: 'Svend',
          userId: 2,
        },
      ];

      service.getMessages('test@family.com').subscribe((messages) => {
        expect(messages).toHaveLength(2);
        expect(messages[0].content).toBe('Hej!');
        expect(messages[1].username).toBe('Svend');
        expect(messages[1].imageId).toBeUndefined();
      });

      httpTesting.expectOne('/api/messages?familyEmail=test@family.com').flush(mockMessages);
    });

    it('returns empty array when no messages exist', () => {
      service.getMessages('empty@family.com').subscribe((messages) => {
        expect(messages).toEqual([]);
      });

      httpTesting.expectOne('/api/messages?familyEmail=empty@family.com').flush([]);
    });
  });
});
