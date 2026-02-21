import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PointsInputComponent } from './components/points-input/points-input';
import { MessageComponent } from './features/message/components/message';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PointsInputComponent, MessageComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');
}
