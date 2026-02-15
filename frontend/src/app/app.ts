import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PointsInputComponent } from './components/points-input/points-input';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PointsInputComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');
}
