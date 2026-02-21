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
      brokerURL: 'ws://localhost:8080/gs-guide-websocket',
      reconnectDelay: 5000,
      debug: (msg) => console.log(msg)
    });
  }

  isConnected() {
    return this.connected;
  }

  connect(onMessage: (msg: string) => void) {
    this.client.onConnect = () => {
      console.log('Connected to backend');
      this.connected = true;

      this.client.subscribe('/topic/greetings', message => {
        const body = JSON.parse(message.body);
        onMessage(body.content);
      });
    };

    this.client.onStompError = (frame) => {
      console.error('Broker error:', frame);
    };

    this.client.activate();
  }

  send(name: string) {
    if (!this.connected) {
      console.warn('Not connected');
      return;
    }

    this.client.publish({
      destination: '/app/hello',
      body: JSON.stringify({ name })
    });
  }

  disconnect() {
    this.client.deactivate();
    this.connected = false;
  }
}
