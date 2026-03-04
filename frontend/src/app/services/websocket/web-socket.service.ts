import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  private client: Client;
  private connected = false;

  constructor() {
    this.client = new Client({
      brokerURL: 'ws://localhost:8080/websocket',
      reconnectDelay: 5000,
      debug: (msg) => console.log('STOMP:', msg)
    });
  }

  //onMessage: called when message arrives
  //onConnected: called whern the socket handshake complete
  connect(onMessage: (msg: any) => void, onConnected: () => void) {
    this.client.onConnect = () => {
      console.log('Connected to backend');
      this.connected = true;
      onConnected();

      this.client.subscribe('/topic/messages', message => {
        const body = JSON.parse(message.body);
        console.log('Received:', body);
        onMessage(body);
      });
    };

    this.client.activate();
  }

  send(userId: number, content: string) {
    if (!this.connected) return;

    this.client.publish({
      destination: '/app/chat',
      body: JSON.stringify({ userId, content })
    });
  }

  disconnect() {
    this.client.deactivate();
    this.connected = false;
  }
}
