import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';

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

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.familyEmail = this.authService.getFamilyEmail();
    if (!this.familyEmail) {
      this.router.navigate(['/login']);
    }
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

    this.http.post('http://localhost:8080/api/users', newUser).subscribe({
      next: () => {
        this.router.navigate(['/select-member']);
      },
      error: (error) => {
        console.error('Error creating member:', error);
        this.showError = true;
      }
    });
  }

  onCancel(): void {
    this.showError = false;
    this.router.navigate(['/select-member']);
  }
}
