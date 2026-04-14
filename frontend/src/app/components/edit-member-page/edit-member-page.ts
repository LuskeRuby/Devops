import { Component, OnInit, inject, signal } from '@angular/core'; // <-- Import signal
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { User, UserService } from '../../services/user.service';

@Component({
  selector: 'app-edit-member-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './edit-member-page.html',
  styleUrls: ['./edit-member-page.scss'],
})
export class EditMemberPageComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  // 1. Define your state as Signals
  user = signal<User | null>(null);
  name = signal('');
  pinCode = signal(''); 
  role = signal('child');
  showError = signal(false);
  isOnlyParent = signal(false);
  
  familyEmail: string | null = null;
  private returnUrl = history.state?.returnUrl;

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    this.familyEmail = this.authService.getFamilyEmail();
    
    if (!this.familyEmail) {
      this.router.navigate(['/login']);
      return;
    }

    if (userId) {
      this.http.get<User>(`/api/users/${userId}`).subscribe({
        next: (userData) => {
          this.user.set(userData);
          this.name.set(userData.name);
          this.role.set(userData.role!);
        },
        error: (err) => console.error(err)
      });
    }

    this.userService.getUsersByFamilyEmail(this.familyEmail).subscribe({
      next: (users) => {
        const onlyParent = users.filter(u => u.role == 'parent').length <= 1;
        this.isOnlyParent.set(onlyParent);
      }
    });
  }

  onPinCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleanPin = input.value.replace(/\D/g, '').slice(0, 4);
    this.pinCode.set(cleanPin);
    input.value = cleanPin;
  }

  onSubmit(): void {
    console.log("Submit!");
    
    if (!this.familyEmail || !this.user()?.id) {
      this.showError.set(true);
      return;
    }

    this.showError.set(false);

    const updatedUser = {
      name: this.name(),
      pincode: this.pinCode(),
      role: this.role(),
    };

    console.log(updatedUser);
    

    this.http.put(`/api/users/${this.user()!.id}`, updatedUser).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl)
    });
  }

  onCancel(): void {
    this.router.navigateByUrl(this.returnUrl);
  }
}