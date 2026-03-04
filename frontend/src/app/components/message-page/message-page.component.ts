import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from '../chat/chat.component';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, ChatComponent],
  templateUrl: './message-page.component.html',
  styleUrls: ['./message-page.component.scss']
})
export class MessageComponent {

  //REPLACE LATER WITH AUTHENICATED USER
  selectedUserId: number | null = null;

  connectAsUser(userId: number) {
    this.selectedUserId = userId;
  }
}
