import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PointsInputComponent } from './components/points-input/points-input';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PointsInputComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');

  constructor(private auth: AuthService) {}

  get isAuthenticated() {
    return this.auth.getAccessToken() !== null;
  }

  logout() {
    this.auth.logout();
  }
}
