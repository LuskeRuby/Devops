import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../services/user.service';
import { AuthService } from "../../auth/auth.service";

@Component({
  selector: 'app-select-member-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-member-page.component.html',
  styleUrls: ['./select-member-page.component.scss']
})
export class SelectMemberPageComponent implements OnInit {
  users = signal([] as User[]);
  familyEmail: string | null = null;

  constructor(
    private router: Router,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('[SelectMemberPage] ngOnInit: Subscribing to familyEmail$');
  
    // Use the observable instead of the synchronous getter
    this.authService.familyEmail$.subscribe(email => {
      console.log(`[SelectMemberPage] Received email from stream: ${email}`);
      this.familyEmail = email;
      
      if (this.familyEmail) {
        this.loadUsers();
      } else {
        console.warn('[SelectMemberPage] Waiting for family email...');
      }
    });
  }

  loadUsers(): void {
    if (!this.familyEmail) return;

    this.userService.getUsersByFamilyEmail(this.familyEmail).subscribe({
      next: (users) => {
        this.users.set(users);
        if (this.users().length === 0) {
          this.router.navigate(['/create-member-page']);
        }
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  selectUser(user: User): void {
    this.router.navigate(['/member-pin'], { state: { user } });
  }

  calculateRewards(totalPoints: number): number {
    const targetPoints = 100;
    return Math.floor(totalPoints / targetPoints);
  }

  getImageUrl(imageId: number | undefined): string {
    return this.userService.getImageUrl(imageId);
  }
}
