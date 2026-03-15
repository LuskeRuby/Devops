import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from '../chat/chat.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, ChatComponent, SidebarComponent],
  templateUrl: './message-page.component.html',
  styleUrls: ['./message-page.component.scss']
})
export class MessageComponent {

  //REPLACE LATER WITH AUTHENICATED USER
  selectedUserId: number | null = null;

  connectAsUser(userId: number) {
    this.selectedUserId = userId;
  }

  onAddMember() {
    console.log('Tilføj medlem clicked');
  }
}
