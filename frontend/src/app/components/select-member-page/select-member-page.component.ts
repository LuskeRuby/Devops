import { Component, OnInit, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { UserService, User } from '../../services/user.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-select-member-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-member-page.component.html',
  styleUrls: ['./select-member-page.component.scss'],
})
export class SelectMemberPageComponent implements OnInit {
  private router = inject(Router);
  private userService = inject(UserService);
  private authService = inject(AuthService);

  users = signal([] as User[]);
  familyEmail: string | null = null;

  ngOnInit(): void {
    console.log('--- Member Selection Screen Initializing ---');
    this.authService.familyEmail$.subscribe((email) => {
      console.log('Family scope detected:', email);
      this.familyEmail = email;

      if (this.familyEmail) {
        this.loadUsers();
      }
    });
  }

  loadUsers(): void {
    if (!this.familyEmail) return;

    this.userService.getUsersByFamilyEmail(this.familyEmail).subscribe({
      next: (users: User[]) => {
        console.log(`Loaded ${users.length} family members.`);
        this.users.set(users);
        if (this.users().length === 0) {
          console.warn('No members found - redirecting to creation page.');
          this.router.navigate(['/create-member-page']);
        }
      },
      error: (error: Error) => {
        console.error('CRITICAL: Failed to load family members from backend:', error);
      },
    });
  }

  selectUser(user: User): void {
    this.router.navigate(['/member-pin'], { state: { user } });
  }

  calculateRewards(totalPoints: number, targetPoints: number): number {
    return Math.floor(totalPoints / targetPoints);
  }

  getImageUrl(imageId: number | undefined): string {
    return this.userService.getImageUrl(imageId);
  }
}
