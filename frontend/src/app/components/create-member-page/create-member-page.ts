import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-create-member-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-member-page.html',
  styleUrls: ['./create-member-page.scss']
})
export class CreateMemberPageComponent implements OnInit {
  name = '';
  pinCode = '';
  role = 'child';
  familyEmail: string | null = null;
  showError = false;
  isFirstUser = false;
  private returnUrl = history.state?.returnUrl || '/select-member';

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.familyEmail = this.authService.getFamilyEmail();
    if (!this.familyEmail) {
      this.router.navigate(['/login']);
      return;
    }

    // Check if this is the first user in the family
    this.userService.getUsersByFamilyEmail(this.familyEmail).subscribe({
      next: (users) => {
        this.isFirstUser = users.length === 0;
        if (this.isFirstUser) {
          this.role = 'parent'; // Set first user as parent
        }
      },
      error: (error) => {
        console.error('Error checking family users:', error);
      }
    });
  }

  onPinCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Only allow numbers and limit to 4 digits
    this.pinCode = input.value.replace(/\D/g, '').slice(0, 4);
    input.value = this.pinCode;
  }

  onSubmit(): void {
    // Show error only if name is empty OR PIN is not exactly 4 digits
    if (!this.name.trim() || this.pinCode.length !== 4 || !this.familyEmail) {
      this.showError = true;
      return;
    }

    this.showError = false;

    const newUser = {
      name: this.name,
      email: this.familyEmail,
      pincode: this.pinCode,
      role: this.role,
      totalPoints: 0,
      family: {
        email: this.familyEmail
      }
    };

    this.http.post('/api/users', newUser).subscribe({
      next: () => {
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (error) => {
        console.error('Error creating member:', error);
        this.showError = true;
      }
    });
  }

  onCancel(): void {
    this.showError = false;
    this.router.navigateByUrl(this.returnUrl);
  }
}
