import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
export class MessageComponent implements OnInit, OnDestroy {

  selectedUserId: number | null = null;
  messageText = '';
  messages: any[] = [];
  isConnected = false;

  constructor(
    private ws: WebSocketService,
    private cd: ChangeDetectorRef
  ) {}

  //connect when component loads
  ngOnInit() {
    this.ws.connect((msg: any) => {
      this.messages = [...this.messages, msg];
      this.cd.detectChanges(); // if needed
    });

    this.isConnected = true;
  }

  //select user1/user2
  connectAsUser(userId: number) {
    this.selectedUserId = userId;
  }

  send() {
    if (this.messageText.trim() && this.selectedUserId) {
      this.ws.send(this.selectedUserId, this.messageText);
      this.messageText = '';
    }
  }

  ngOnDestroy() {
    //do nothing
  }
}
