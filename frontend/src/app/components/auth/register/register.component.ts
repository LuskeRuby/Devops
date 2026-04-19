import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { form, FormField, required, email, minLength } from '@angular/forms/signals';
import { AuthFormBase } from '../auth-form.base';
import { ErrorBannerComponent } from '../../error-banner/error-banner.component';

interface RegisterData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormField, ErrorBannerComponent],
})
export class RegisterComponent extends AuthFormBase {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly registerModel = signal<RegisterData>({ email: '', password: '' });

  readonly registerForm = form(this.registerModel, (f) => {
    required(f.email, { message: 'Email er påkrævet.' });
    email(f.email, { message: 'Indtast venligst en gyldig email.' });
    required(f.password, { message: 'Adgangskode er påkrævet.' });
    minLength(f.password, 8, { message: 'Adgangskode skal være mindst 8 tegn.' });
  });

  submit(): void {
    if (this.isLoading()) return;
    if (this.registerForm().invalid()) return;

    this.setLoading(true);

    const { email, password } = this.registerModel();

    this.auth.register({ email, password }).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => {
        console.error('Register error:', err);
        const status = err?.status;
        const serverMsg = err?.error?.message || err?.error?.error || null;
        if (serverMsg) {
          this.setError(serverMsg);
        } else if (status === 409) {
          this.setError('Der findes allerede en konto med den email.');
        } else {
          this.setError('Registrering mislykkedes. Prøv igen.');
        }
        this.setLoading(false);
      },
    });
  }
}
