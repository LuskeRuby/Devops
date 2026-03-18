import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  private client: Client;
  private connected = false;

  constructor() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    this.client = new Client({
      brokerURL: `${wsProtocol}://${window.location.host}/websocket`,
      reconnectDelay: 5000,
      debug: (msg) => console.log('STOMP:', msg)
    });
  }

  //onMessage: called when message arrives
  //onConnected: called whern the socket handshake complete
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
