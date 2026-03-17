import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {

  private userService = inject(UserService);

  currentUser = this.userService.currentUser;
  familyMembers = signal<User[]>([]);

  get isParent(): boolean {
    return this.currentUser()?.role?.toUpperCase() === 'PARENT';
  }

  ngOnInit(): void {
    const familyEmail = this.userService.currentUser()?.familyEmail;
    if (!familyEmail) return;

    this.userService.getUsersByFamilyEmail(familyEmail).subscribe({
      next: (members) => this.familyMembers.set(members),
      error: (err) => console.error('Failed to load family members:', err),
    });
  }

  onLogout(): void {
    this.userService.logoutUser();
  }
}
