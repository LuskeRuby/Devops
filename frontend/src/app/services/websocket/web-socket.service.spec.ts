import { TestBed } from '@angular/core/testing';
import { WebSocketService } from './web-socket.service';
import { AuthService } from '../../auth/auth.service';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

/*Mock the @stomp/stompjs Client at module level
since vi.mock doesn't work with Angular*/
describe('WebSocketService', () => {
  let service: WebSocketService;
  let authService: {
    getAccessToken: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authService = {
      getAccessToken: vi.fn().mockReturnValue('test-jwt-token'),
      refresh: vi.fn().mockReturnValue(of({})),
    };

    TestBed.configureTestingModule({
      providers: [WebSocketService, { provide: AuthService, useValue: authService }],
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
      vi.spyOn(client, 'subscribe').mockImplementation(() => ({
        id: 'sub-0',
        unsubscribe: vi.fn(),
      }));

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
      vi.spyOn(client, 'subscribe').mockImplementation(() => ({
        id: 'sub-0',
        unsubscribe: vi.fn(),
      }));

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
        expect.any(Function),
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

  describe('reconnect', () => {
    it('offers 10 s heartbeats so an idle socket is not closed by the proxy', () => {
      const client = (service as any).client;

      expect(client.heartbeatIncoming).toBe(10000);
      expect(client.heartbeatOutgoing).toBe(10000);
    });

    it('reads the current token on every (re)connect, not the one from the first connect', async () => {
      const client = (service as any).client;
      authService.getAccessToken.mockReturnValue('token-after-refresh');

      await client.beforeConnect(client);

      expect(client.connectHeaders).toEqual({ Authorization: 'Bearer token-after-refresh' });
      expect(authService.refresh).not.toHaveBeenCalled();
    });

    it('refreshes the session first when the stored token has expired', async () => {
      const client = (service as any).client;
      authService.getAccessToken.mockReturnValueOnce(null).mockReturnValue('fresh-token');

      await client.beforeConnect(client);

      expect(authService.refresh).toHaveBeenCalledTimes(1);
      expect(client.connectHeaders).toEqual({ Authorization: 'Bearer fresh-token' });
    });

    it('still connects (and is rejected by the server) when the refresh fails', async () => {
      const client = (service as any).client;
      authService.getAccessToken.mockReturnValue(null);
      authService.refresh.mockReturnValue(throwError(() => new Error('401')));

      await client.beforeConnect(client);

      expect(client.connectHeaders).toEqual({ Authorization: 'Bearer ' });
    });

    it('reports the loss of the connection and blocks sending until it is back', () => {
      const client = (service as any).client;
      const onDisconnected = vi.fn();
      vi.spyOn(client, 'activate').mockImplementation(() => {
        client.onConnect?.();
      });
      vi.spyOn(client, 'subscribe').mockImplementation(() => ({
        id: 'sub-0',
        unsubscribe: vi.fn(),
      }));
      const publishSpy = vi.spyOn(client, 'publish').mockImplementation(() => {});
      service.connect('test@family.com', vi.fn(), vi.fn(), onDisconnected);

      client.onWebSocketClose();

      expect(onDisconnected).toHaveBeenCalledTimes(1);
      expect(service.send(1, 'Hej', 'test@family.com')).toBe(false);
      expect(publishSpy).not.toHaveBeenCalled();

      // stompjs reconnects on its own: onConnect fires again and sending works again
      client.onConnect();
      expect(service.send(1, 'Hej', 'test@family.com')).toBe(true);
      expect(publishSpy).toHaveBeenCalledTimes(1);
    });

    it('re-subscribes to the family topic after a reconnect', () => {
      const client = (service as any).client;
      const subscribeSpy = vi.spyOn(client, 'subscribe').mockImplementation(() => ({
        id: 'sub-0',
        unsubscribe: vi.fn(),
      }));
      vi.spyOn(client, 'activate').mockImplementation(() => {
        client.onConnect?.();
      });
      service.connect('test@family.com', vi.fn(), vi.fn());

      client.onWebSocketClose();
      client.onConnect();

      expect(subscribeSpy).toHaveBeenCalledTimes(2);
    });

    it('also treats a STOMP error frame as a lost connection', () => {
      const client = (service as any).client;
      const onDisconnected = vi.fn();
      vi.spyOn(client, 'activate').mockImplementation(() => {
        client.onConnect?.();
      });
      vi.spyOn(client, 'subscribe').mockImplementation(() => ({
        id: 'sub-0',
        unsubscribe: vi.fn(),
      }));
      service.connect('test@family.com', vi.fn(), vi.fn(), onDisconnected);

      client.onStompError({});

      expect(onDisconnected).toHaveBeenCalledTimes(1);
    });
  });

  describe('send', () => {
    it('returns false instead of throwing when the socket dropped without a close event', () => {
      const client = (service as any).client;
      const onDisconnected = vi.fn();
      vi.spyOn(client, 'activate').mockImplementation(() => {
        client.onConnect?.();
      });
      vi.spyOn(client, 'subscribe').mockImplementation(() => ({
        id: 'sub-0',
        unsubscribe: vi.fn(),
      }));
      vi.spyOn(client, 'publish').mockImplementation(() => {
        throw new TypeError('There is no underlying STOMP connection');
      });
      service.connect('test@family.com', vi.fn(), vi.fn(), onDisconnected);

      expect(service.send(1, 'Hej', 'test@family.com')).toBe(false);
      expect(onDisconnected).toHaveBeenCalledTimes(1);
    });

    it('publishes message to /app/chat when connected', () => {
      const client = (service as any).client;
      const publishSpy = vi.spyOn(client, 'publish').mockImplementation(() => {});
      vi.spyOn(client, 'activate').mockImplementation(() => {
        client.onConnect?.();
      });
      vi.spyOn(client, 'subscribe').mockImplementation(() => ({
        id: 'sub-0',
        unsubscribe: vi.fn(),
      }));

      service.connect('test@family.com', vi.fn(), vi.fn());

      expect(service.send(1, 'Hej fra test!', 'test@family.com')).toBe(true);

      expect(publishSpy).toHaveBeenCalledWith({
        destination: '/app/chat',
        body: JSON.stringify({
          userId: 1,
          content: 'Hej fra test!',
          familyEmail: 'test@family.com',
        }),
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
      vi.spyOn(client, 'subscribe').mockImplementation(() => ({
        id: 'sub-0',
        unsubscribe: vi.fn(),
      }));
      vi.spyOn(client, 'deactivate').mockImplementation(() => {});
      const publishSpy = vi.spyOn(client, 'publish').mockImplementation(() => {});

      service.connect('test@family.com', vi.fn(), vi.fn());
      service.disconnect();
      service.send(1, 'Should not send', 'test@family.com');

      expect(publishSpy).not.toHaveBeenCalled();
    });
  });
});
