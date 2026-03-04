import{FormsModule}from'@angular/forms';
import { Component } from '@angular/core';
import{CommonModule}from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-member-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-member-page.html',
  styleUrls: ['./create-member-page.scss']
})
export class CreateMemberPageComponent {
  name: string = '';
  pinCode: string = '';
  role: string = 'child';
  showError: boolean = false;

  constructor(private router: Router) {}

  onPinCodeInput(event: any): void {
    let value = event.target.value;
    // Limit to 4 digits
    value = value.slice(0, 4);
    this.pinCode = value;
  }
  onSubmit(): void {
    if (!this.name || this.pinCode.length !== 4) {
      this.showError = true;
      return;
    }
    this.showError = false;
    console.log('Member created:', { name: this.name, pinCode: this.pinCode, role: this.role });
    this.router.navigate(['/select-member']);
  }

  onCancel(): void {
    this.router.navigate(['/select-member']);
  }
}
