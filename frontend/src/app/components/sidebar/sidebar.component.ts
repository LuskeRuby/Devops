import { Component, Output, EventEmitter, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService, User } from '../../services/user.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {

  private userService = inject(UserService);
  private authService = inject(AuthService);

  currentUser = this.userService.currentUser;
  familyMembers = signal<User[]>([]);

  get isParent(): boolean {
    return this.currentUser()?.role === 'parent';
  }

  ngOnInit(): void {
    const familyEmail = this.userService.currentUser()?.email;
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
