import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from './web-socket-service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message-page.component.html',
  styleUrls: ['./message-page.component.scss']
})
export class MessageComponent implements OnInit, OnDestroy {

  selectedUserId: number | null = null;
  messageText = '';
  messages: any[] = [];
  isConnected = false;

  constructor(
    private ws: WebSocketService,
    private cd: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  //connect when component loads
  ngOnInit() {
    //load messages from DB
    this.http.get<any[]>('http://localhost:8080/api/messages')
      .subscribe(data => {
        this.messages = data;
        this.cd.detectChanges();
      });

    //connect WebSocket for live messsagin
    this.ws.connect((msg: any) => {
      this.messages = [...this.messages, msg];
      this.cd.detectChanges();
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
