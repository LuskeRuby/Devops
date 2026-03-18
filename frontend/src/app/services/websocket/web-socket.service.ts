import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  private client: Client;
  private connected = false;

  constructor(private authService: AuthService) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    this.client = new Client({
      brokerURL: `${wsProtocol}://${window.location.host}/websocket`,
      reconnectDelay: 5000,
      connectHeaders: {
        Authorization: `Bearer ${this.authService.getAccessToken()}`
      }
    });
  }

  connect(familyEmail: string, onMessage: (msg: any) => void, onConnected: () => void) {
    this.client.onConnect = () => {
      console.log('Connected to backend');
      this.connected = true;
      onConnected();

      this.client.subscribe(`/topic/messages/${familyEmail}`, message => {
        const body = JSON.parse(message.body);
        onMessage(body);
      });
    };

    this.client.activate();
  }

  send(userId: number, content: string, familyEmail: string) {
    if (!this.connected) return;

    this.client.publish({
      destination: '/app/chat',
      body: JSON.stringify({ userId, content, familyEmail })
    });
  }

  disconnect() {
    this.client.deactivate();
    this.connected = false;
  }
}
