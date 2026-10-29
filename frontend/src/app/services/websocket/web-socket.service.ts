import { Injectable, inject } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { MessageResponse } from '../message/message.service';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private authService = inject(AuthService);

  private client: Client;
  private connected = false;
  private onDisconnected: (() => void) | null = null;

  constructor() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    this.client = new Client({
      brokerURL: `${wsProtocol}://${window.location.host}/websocket`,
      reconnectDelay: 5000,
      // Keep an idle socket alive: proxies such as nginx close a connection that carries no data
      // for 60 s. The server answers with the same interval (see WebSocketConfig).
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    // The access token only lives 60 s, so a reconnect must not reuse the one from the first
    // connect: read the current token every time stompjs (re)connects, refreshing it if it expired.
    this.client.beforeConnect = async () => {
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

    this.client.connectHeaders = {
      Authorization: `Bearer ${this.authService.getAccessToken()}`,
    };

    // Runs again after every automatic reconnect, so the subscription is restored too.
    this.client.onConnect = () => {
      this.connected = true;
      onConnected();

      this.client.subscribe(`/topic/messages/${familyEmail}`, (message) => {
        const body = JSON.parse(message.body);
        onMessage(body);
      });
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
    if (wasConnected) this.onDisconnected?.();
  }
}
