import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { form, FormField, required, email, minLength } from '@angular/forms/signals';
import { AuthFormBase } from '../auth-form.base';
import {ErrorBannerComponent} from '../../error-banner/error-banner.component';

interface RegisterData {
  email:    string;
  password: string;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormField, ErrorBannerComponent],
})
export class RegisterComponent extends AuthFormBase {
  readonly registerModel = signal<RegisterData>({ email: '', password: '' });

  readonly registerForm = form(this.registerModel, (f) => {
    required(f.email,     { message: 'Email is required.' });
    email(f.email,        { message: 'Please enter a valid email.' });
    required(f.password,  { message: 'Password is required.' });
    minLength(f.password, 8, { message: 'Password must be at least 8 characters.' });
  });

  constructor(private auth: AuthService, private router: Router) {
    super();
  }

  submit(): void {
    if (this.isLoading()) return;
    if (this.registerForm().invalid()) return;

    this.setLoading(true);

    const { email, password } = this.registerModel();

    this.auth.register({ email, password }).subscribe({
      next:  () => this.router.navigate(['/login']),
      error: () => {
        this.setError('Registration failed. Please try again.');
        this.setLoading(false);
      },
    });
  }
}
