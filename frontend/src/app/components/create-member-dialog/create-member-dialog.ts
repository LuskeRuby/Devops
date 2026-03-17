import { Component, OnInit, Output, EventEmitter, Input, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../services/user.service';
import { CreateMemberPageComponent } from '../create-member-page/create-member-page';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-create-member-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: '../create-member-page/create-member-page.html',
  styleUrls: ['../create-member-page/create-member-page.scss']
})
export class CreateMemberDialogCompoenent implements OnInit {
  // 1. Add Event Emitters to talk to the parent component
  @Output() onClose = new EventEmitter<void>();
  @Output() onSuccess = new EventEmitter<void>();

  // Optional: Allow parent to pass the email in, fallback to AuthService if not provided
  @Input() familyEmail: string | null = null; 

  name = '';
  pinCode = '';
  role = 'child';
  showError = false;
  isFirstUser = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService,
    @Optional() private dialogRef: MatDialogRef<CreateMemberPageComponent>
  ) {}

  ngOnInit(): void {
    // Fallback to auth service if the parent didn't pass it via @Input
    this.familyEmail = this.userService.currentUser()?.email || this.authService.getFamilyEmail() || null;

    if (!this.familyEmail) {
      // If we STILL don't have an email, we can't proceed. 
      // Emitting close so the parent can handle the error state or redirect.
      console.error("No family email found.");
      this.onClose.emit();
      return;
    }

    this.userService.getUsersByFamilyEmail(this.familyEmail).subscribe({
      next: (users) => {
        this.isFirstUser = users.length === 0;
        if (this.isFirstUser) {
          this.role = 'parent';
        }
      },
      error: (error) => {
        console.error('Error checking family users:', error);
      }
    });
  }

  onPinCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pinCode = input.value.replace(/\D/g, '').slice(0, 4);
    input.value = this.pinCode;
  }

  onSubmit(): void {
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
        // 3. Close the Material dialog and pass 'true' back to the parent
        if (this.dialogRef) {
          this.dialogRef.close(true); 
        }
      },
      error: (error) => {
        console.error('Error creating member:', error);
        this.showError = true;
      }
    });
  }

  onCancel(): void {
    this.showError = false;
    // 4. Close the Material dialog and pass 'false' back to the parent
    if (this.dialogRef) {
      this.dialogRef.close(false);
    }
  }
}