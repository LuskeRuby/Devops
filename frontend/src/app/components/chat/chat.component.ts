import { Component, Input, OnInit, OnDestroy, OnChanges, ChangeDetectorRef, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from '../../services/websocket/web-socket.service';
import { MessageService, MessageResponse } from '../../services/message/message.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})

export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {

  @Input() selectedUserId: number | null = null;
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  messageText = '';
  messages: MessageResponse[] = [];
  isConnected = false;
  private shouldScroll = false;

  constructor(
    private ws: WebSocketService,
    private cd: ChangeDetectorRef,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.messageService.getMessages().subscribe(data => {
      this.messages = data;
      this.shouldScroll = true;
      this.cd.detectChanges();
    });

    this.ws.connect(

      //callbackfunction 1: runs when a message arrives
      (msg: any) => {
        this.messages = [...this.messages, msg];
        this.shouldScroll = true;
        this.cd.detectChanges();
      },

      //callback 2: runs when socket is ready
      () => {
        this.isConnected = true;
        this.cd.detectChanges();
      }
    );
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy() {
    this.ws.disconnect();
  }

  send() {
    if (this.messageText.trim() && this.isConnected) {
      this.ws.send(this.selectedUserId!, this.messageText);
      this.messageText = '';
    }
  }

  private scrollToBottom() {
    try {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }


  //Timestamp logic
  isDifferentDay(a: string, b: string): boolean {
    return new Date(a).toDateString() !== new Date(b).toDateString();
  }

  formatDateLabel(timestamp: string): string {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'I dag';
    if (date.toDateString() === yesterday.toDateString()) return 'I går';

    return date.toLocaleDateString('da-DK', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
  }

}
