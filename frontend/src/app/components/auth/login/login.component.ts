import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { form, FormField, required, email, minLength } from '@angular/forms/signals';
import { AuthFormBase } from '../auth-form.base';
import { SpinnerComponent } from '../../spinner/spinner.component';
import { ErrorBannerComponent } from '../../error-banner/error-banner.component';

interface LoginData {
  email:    string;
  password: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormField, SpinnerComponent, ErrorBannerComponent],
})
export class LoginComponent extends AuthFormBase {
  readonly loginModel = signal<LoginData>({ email: '', password: '' });

  readonly loginForm = form(this.loginModel, (f) => {
    required(f.email,     { message: 'Email is required.' });
    email(f.email,        { message: 'Please enter a valid email.' });
    required(f.password,  { message: 'Password is required.' });
    minLength(f.password, 8, { message: 'Password must be at least 8 characters.' });
  });

  rememberMe = signal(false);

  constructor(private auth: AuthService, private router: Router) {
    super();
  }

  onRememberMeChange(event: Event): void {
    this.rememberMe.set((event.target as HTMLInputElement).checked);
  }

  submit(): void {
    if (this.loginForm().invalid()) return;

    this.setLoading(true);
    this.setError(null);

    const { email, password } = this.loginModel();

    this.auth.login({ email, password }).subscribe({
      next:  () => this.router.navigate(['/home']),
      error: () => {
        this.setError('Login failed. Please check your credentials.');
        this.setLoading(false);
      },
    });
  }
}
