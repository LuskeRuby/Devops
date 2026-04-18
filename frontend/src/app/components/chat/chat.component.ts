import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from '../../services/websocket/web-socket.service';
import { MessageService, MessageResponse } from '../../services/message/message.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  private ws = inject(WebSocketService);
  private cd = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);
  private userService = inject(UserService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  get selectedUserId(): number | null {
    return this.userService.currentUser()?.id ?? null;
  }

  get familyEmail(): string | null {
    const user = this.userService.currentUser();
    return user?.familyEmail || user?.family?.email || user?.email || null;
  }

  messageText = '';
  messages: MessageResponse[] = [];
  isConnected = false;
  private shouldScroll = false;

  ngOnInit() {
    const familyEmail = this.familyEmail;
    if (!familyEmail) return;

    this.messageService.getMessages(familyEmail).subscribe((data) => {
      console.log(`Chat history loaded: ${data.length} messages.`);
      this.messages = data;
      this.shouldScroll = true;
      this.cd.detectChanges();
      setTimeout(() => this.scrollToBottom(), 0);
    });

    this.ws.connect(
      familyEmail,
      (msg) => {
        console.log('New message received via WebSocket:', msg);
        this.messages = [...this.messages, msg];
        this.shouldScroll = true;
        this.cd.detectChanges();
        setTimeout(() => this.scrollToBottom(), 0);
      },
      () => {
        console.log('Chat system connected and ready.');
        this.isConnected = true;
        this.cd.detectChanges();
      },
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
    const familyEmail = this.familyEmail;
    if (this.messageText.trim() && this.isConnected && familyEmail) {
      this.ws.send(this.selectedUserId!, this.messageText, familyEmail);
      this.messageText = '';
    }
  }

  private scrollToBottom() {
    try {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {
      /* ignored */
    }
  }

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
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  getImageUrl(imageId: number | undefined): string {
    return this.userService.getImageUrl(imageId);
  }
}
