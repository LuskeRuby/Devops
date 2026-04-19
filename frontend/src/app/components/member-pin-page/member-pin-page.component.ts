import { Component, OnInit, ElementRef, QueryList, ViewChildren, inject } from '@angular/core';

import { Router } from '@angular/router';
import { User, UserService } from '../../services/user.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-member-pin-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './member-pin-page.component.html',
  styleUrls: ['./member-pin-page.component.scss'],
})
export class MemberPinPageComponent implements OnInit {
  private router = inject(Router);
  private userService = inject(UserService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  user: User | null = null;
  pin: string[] = ['', '', '', ''];
  errorMessage = '';

  @ViewChildren('pinInput') pinInputs!: QueryList<ElementRef>;

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { user: User };
    if (state && state.user) {
      this.user = state.user;
    }
  }

  ngOnInit(): void {
    if (!this.user) {
      this.router.navigate(['/select-member']);
      return;
    }
  }

  getImageUrl(imageId: number | undefined): string {
    return this.userService.getImageUrl(imageId);
  }

  trackByFn(index: number): number {
    return index;
  }

  onPinInput(index: number, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;
    if (value && index < 3) {
      this.pinInputs.toArray()[index + 1].nativeElement.focus();
    }
    if (this.pin.every((digit) => digit !== '')) {
      this.validatePin();
    }
  }

  onKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      if (!this.pin[index] && index > 0) {
        this.pinInputs.toArray()[index - 1].nativeElement.focus();
      }
    }
  }

  validatePin(): void {
    this.errorMessage = '';
    const pinString = this.pin.join('');
    const userId = this.user?.id || 0;

    this.userService.validatePin(userId, pinString).subscribe({
      next: (res) => {
        if (res.accessToken && this.user) {
          // Update the token so backend recognizes the profile-specific role
          this.authService.setAccessTokenFromRefresh(res.accessToken);
          this.userService.setCurrentUser(this.user);
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err: unknown) => {
        console.error('PIN validation failed:', err);
        this.errorMessage = 'Forkert pinkode. Prøv igen.';
        this.pin = ['', '', '', ''];
        setTimeout(() => {
          this.pinInputs.first.nativeElement.focus();
        }, 0);
      },
    });
  }
}
