import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from '../web-socket-service';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message.html',
  styleUrls: ['./message.scss']
})
export class MessageComponent {

  name = '';
  messages: string[] = [];

  constructor(private ws: WebSocketService) {}

  isConnected = false;

  connect() {
    this.ws.connect((msg: string) => {
      this.messages.push(msg);
    });
    this.isConnected = true;
  }

  disconnect() {
    this.ws.disconnect();
    this.isConnected = false;
  }

  send() {
    if (this.name.trim()) {
      this.ws.send(this.name);
      this.name = '';
    }
  }
}
