import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from '../chat/chat.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, ChatComponent, SidebarComponent],
  templateUrl: './message-page.component.html',
  styleUrls: ['./message-page.component.scss']
})
export class MessageComponent {
  private userService = inject(UserService);

  selectedUserId = this.userService.currentUser()?.id ?? null;

}
