import { TestBed } from '@angular/core/testing';
import { WebSocketService } from './web-socket.service';
import { AuthService } from '../../auth/auth.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

/*Mock the @stomp/stompjs Client at module level
since vi.mock doesn't work with Angular*/
describe('WebSocketService', () => {
  let service: WebSocketService;
  let authService: { getAccessToken: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = {
      getAccessToken: vi.fn().mockReturnValue('test-jwt-token'),
    };

    TestBed.configureTestingModule({
      providers: [
        WebSocketService,
        { provide: AuthService, useValue: authService },
      ],
    });

    service = TestBed.inject(WebSocketService);
  });

  describe('connect', () => {
    it('sets Authorization header from AuthService token', () => {
      const onMessage = vi.fn();
      const onConnected = vi.fn();
      const client = (service as any).client;
      vi.spyOn(client, 'activate').mockImplementation(() => {
        client.onConnect?.();
      });
      vi.spyOn(client, 'subscribe').mockImplementation(() => ({ id: 'sub-0', unsubscribe: vi.fn() }));

      service.connect('test@family.com', onMessage, onConnected);

      expect(client.connectHeaders).toEqual({
        Authorization: 'Bearer test-jwt-token',
      });
      expect(authService.getAccessToken).toHaveBeenCalled();
    });

    it('calls onConnected callback when connection is established', () => {
      const onMessage = vi.fn();
      const onConnected = vi.fn();

      const client = (service as any).client;
      vi.spyOn(client, 'activate').mockImplementation(() => {
        client.onConnect?.();
      });
      vi.spyOn(client, 'subscribe').mockImplementation(() => ({ id: 'sub-0', unsubscribe: vi.fn() }));

      service.connect('test@family.com', onMessage, onConnected);

      expect(onConnected).toHaveBeenCalled();
    });

    it('subscribes to the correct family topic', () => {
      const onMessage = vi.fn();
      const onConnected = vi.fn();

      const client = (service as any).client;
      const subscribeSpy = vi.spyOn(client, 'subscribe').mockImplementation(() => ({
        id: 'sub-0',
        unsubscribe: vi.fn(),
      }));
      vi.spyOn(client, 'activate').mockImplementation(() => {
        client.onConnect?.();
      });

      service.connect('test@family.com', onMessage, onConnected);

      expect(subscribeSpy).toHaveBeenCalledWith(
        '/topic/messages/test@family.com',
        expect.any(Function)
      );
    });

    it('passes parsed message body to onMessage callback', () => {
      const onMessage = vi.fn();
      const onConnected = vi.fn();
      const mockMsg = { id: 1, content: 'Hej!', username: 'Anders' };

      const client = (service as any).client;
      vi.spyOn(client, 'subscribe').mockImplementation((...args: any[]) => {
        const callback = args[1];
        callback({ body: JSON.stringify(mockMsg) });
        return { id: 'sub-0', unsubscribe: vi.fn() };
      });
      vi.spyOn(client, 'activate').mockImplementation(() => {
        client.onConnect?.();
      });

      service.connect('test@family.com', onMessage, onConnected);

      expect(onMessage).toHaveBeenCalledWith(mockMsg);
    });
  });

  describe('send', () => {
    it('publishes message to /app/chat when connected', () => {
      const client = (service as any).client;
      const publishSpy = vi.spyOn(client, 'publish').mockImplementation(() => {});
      vi.spyOn(client, 'activate').mockImplementation(() => {
        client.onConnect?.();
      });
      vi.spyOn(client, 'subscribe').mockImplementation(() => ({ id: 'sub-0', unsubscribe: vi.fn() }));

      service.connect('test@family.com', vi.fn(), vi.fn());

      service.send(1, 'Hej fra test!', 'test@family.com');

      expect(publishSpy).toHaveBeenCalledWith({
        destination: '/app/chat',
        body: JSON.stringify({ userId: 1, content: 'Hej fra test!', familyEmail: 'test@family.com' }),
      });
    });

    it('does not publish when not connected', () => {
      const client = (service as any).client;
      const publishSpy = vi.spyOn(client, 'publish').mockImplementation(() => {});

      service.send(1, 'Should not send', 'test@family.com');

      expect(publishSpy).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('deactivates the STOMP client', () => {
      const client = (service as any).client;
      const deactivateSpy = vi.spyOn(client, 'deactivate').mockImplementation(() => {});

      service.disconnect();

      expect(deactivateSpy).toHaveBeenCalled();
    });

    it('prevents sending after disconnect', () => {
      const client = (service as any).client;
      vi.spyOn(client, 'activate').mockImplementation(() => {
        client.onConnect?.();
      });
      vi.spyOn(client, 'subscribe').mockImplementation(() => ({ id: 'sub-0', unsubscribe: vi.fn() }));
      vi.spyOn(client, 'deactivate').mockImplementation(() => {});
      const publishSpy = vi.spyOn(client, 'publish').mockImplementation(() => {});

      service.connect('test@family.com', vi.fn(), vi.fn());
      service.disconnect();
      service.send(1, 'Should not send', 'test@family.com');

      expect(publishSpy).not.toHaveBeenCalled();
    });
  });
});
