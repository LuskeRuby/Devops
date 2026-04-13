import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private auth = inject(AuthService);

  protected readonly title = signal('frontend');

  get isAuthenticated() {
    return this.auth.isAuthenticated();
  }

  logout() {
    this.auth.logout();
  }
}
