import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from '../web-socket-service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message.html',
  styleUrls: ['./message.scss']
})
export class MessageComponent {

  userId = 1; //USE LOGGED IN USER LATER'"!!!!!!
  messageText = '';
  messages: any[] = [];
  isConnected = false;

  constructor(private ws: WebSocketService, private cd: ChangeDetectorRef) {}

  connect() {
    this.ws.connect((msg: any) => {
      this.messages = [...this.messages, msg];
      this.cd.detectChanges(); //Force update
    });

    this.isConnected = true;
  }

  disconnect() {
    this.ws.disconnect();
    this.isConnected = false;
  }

  send() {
    if (this.messageText.trim()) {
      this.ws.send(this.userId, this.messageText);
      this.messageText = '';
    }
  }
}
