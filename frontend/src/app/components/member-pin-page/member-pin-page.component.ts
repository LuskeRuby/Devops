import { Component, OnInit, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { User, UserService } from '../../services/user.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-member-pin-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './member-pin-page.component.html',
  styleUrls: ['./member-pin-page.component.scss']
})
export class MemberPinPageComponent implements OnInit {
  user: User | null = null;
  pin: string[] = ['', '', '', ''];
  errorMessage: string = '';

  @ViewChildren('pinInput') pinInputs!: QueryList<ElementRef>;

  constructor(private router: Router, private userService: UserService) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { user: User };
    if (state && state.user) {
      this.user = state.user;
    }
  }

  trackByFn(index: number, item: any): number {
    return index;
  }

  ngOnInit(): void {
    if (!this.user) {
      this.router.navigate(['/select-member']);
    }
  }

  onPinInput(index: number, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;

    if (value && index < 3) {
      this.pinInputs.toArray()[index + 1].nativeElement.focus();
    }

    if (this.pin.every(digit => digit !== '')) {
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

  validatePin() {
    this.errorMessage = '';
    const pinString = this.pin.join('');

    // Fallback ID fix if null, though user should be present
    const userId = this.user?.id || 0;

    this.userService.validatePin(userId, pinString).subscribe({
      next: (isValid: boolean) => {
        if (isValid && this.user) {
          this.userService.setCurrentUser(this.user!);
          this.router.navigate(['/home']);
        }
      },
      error: (err: any) => {
        console.error('PIN validation failed:', err);
        this.errorMessage = 'Forkert pinkode. Prøv igen.';
        // Clear pin boxes
        this.pin = ['', '', '', ''];
        // Focus back to first box
        setTimeout(() => {
          this.pinInputs.first.nativeElement.focus();
        }, 0);
      }
    });
  }
}
