import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '../../services/user.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

  @Output() addMember = new EventEmitter<void>();

  //MANGLER AUTHENTICATION...
  currentUser: User = { id: 1, name: 'user1', email: '', avatarUrl: '' };
  role: 'parent' | 'child' = 'parent'; // TODO: Replace with currentUser.role

  //MANGLER AUTHENTICATION...
  familyMembers: User[] = [
    { id: 1, name: 'user1', email: '', avatarUrl: '' },
    { id: 2, name: 'user2', email: '', avatarUrl: '' },
    { id: 3, name: 'user3', email: '', avatarUrl: '' },
    { id: 4, name: 'user4', email: '', avatarUrl: '' },
  ];

  get isParent(): boolean {
    return this.role === 'parent';
  }

  onAddMember(): void {
    this.addMember.emit();
  }
}
