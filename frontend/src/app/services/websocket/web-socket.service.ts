import { Injectable, inject } from '@angular/core';
import { Client, ReconnectionTimeMode } from '@stomp/stompjs';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { MessageResponse } from '../message/message.service';

/** Longest random wait added before a reconnect attempt, so clients do not all retry at once. */
const RECONNECT_JITTER_MS = 1000;

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private authService = inject(AuthService);

  private client: Client;
  private connected = false;
  private reconnecting = false;
  private onDisconnected: (() => void) | null = null;

  constructor() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    this.client = new Client({
      brokerURL: `${wsProtocol}://${window.location.host}/websocket`,
      // After a drop, retry after 1 s, then 2 s, 4 s ... up to 30 s (plus a random jitter, see
      // beforeConnect) instead of every 5 s, so a restarted backend or broker is not hammered.
      reconnectDelay: 1000,
      maxReconnectDelay: 30000,
      reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
      // Keep an idle socket alive: proxies such as nginx close a connection that carries no data
      // for 60 s. The server answers with the same interval (see WebSocketConfig).
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    // The access token only lives 60 s, so a reconnect must not reuse the one from the first
    // connect: read the current token every time stompjs (re)connects, refreshing it if it expired.
    this.client.beforeConnect = async () => {
      if (this.reconnecting) {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * RECONNECT_JITTER_MS));
      }
      let token = this.authService.getAccessToken();
      if (!token) {
        try {
          await firstValueFrom(this.authService.refresh());
          token = this.authService.getAccessToken();
        } catch {
          // No valid session: connect without a token, the server rejects it and stompjs retries.
        }
      }
      this.client.connectHeaders = { Authorization: `Bearer ${token ?? ''}` };
    };

    this.client.onWebSocketClose = () => this.markDisconnected();
    this.client.onStompError = () => this.markDisconnected();
  }

  connect(
    familyEmail: string,
    onMessage: (msg: MessageResponse) => void,
    onConnected: () => void,
    onDisconnected?: () => void,
  ) {
    this.onDisconnected = onDisconnected ?? null;
    this.reconnecting = false;

    this.client.connectHeaders = {
      Authorization: `Bearer ${this.authService.getAccessToken()}`,
    };

    // Runs again after every automatic reconnect, so the subscription is restored too.
    this.client.onConnect = () => {
      this.connected = true;
      this.reconnecting = false;

      // "messages.<email>", not "messages/<email>": RabbitMQ rejects a slash in a topic name. The backend
      // publishes to the same name (MessageSocketController).
      this.client.subscribe(`/topic/messages.${familyEmail}`, (message) => {
        const body = JSON.parse(message.body);
        onMessage(body);
      });

      // Only after subscribing: the callback loads the history, so everything saved from here on arrives
      // live and everything before it is in the history, with no gap in between.
      onConnected();
    };

    this.client.activate();
  }

  /** Sends a chat message. Returns false (and sends nothing) when there is no live connection. */
  send(userId: number, content: string, familyEmail: string): boolean {
    if (!this.connected) return false;

    try {
      this.client.publish({
        destination: '/app/chat',
        body: JSON.stringify({ userId, content, familyEmail }),
      });
      return true;
    } catch {
      // The socket dropped without us noticing yet ("There is no underlying STOMP connection").
      this.markDisconnected();
      return false;
    }
  }

  disconnect() {
    this.onDisconnected = null;
    this.connected = false;
    this.client.deactivate();
  }

  private markDisconnected() {
    const wasConnected = this.connected;
    this.connected = false;
    // stompjs retries by itself from here; beforeConnect adds the jitter.
    this.reconnecting = true;
    if (wasConnected) this.onDisconnected?.();
  }
}
