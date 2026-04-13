import { signal } from '@angular/core';

export abstract class AuthFormBase {
  isLoading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  protected setLoading(value: boolean): void {
    this.isLoading.set(value);
  }

  protected setError(message: string | null): void {
    this.error.set(message);
  }
}
