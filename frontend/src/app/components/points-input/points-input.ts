import { FormsModule } from '@angular/forms'; 
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-points-input', 
  standalone: true,
  imports: [FormsModule], 
  templateUrl: './points-input.html', 
  styleUrl: './points-input.scss'    
})
export class PointsInputComponent {
  @Input() taskPoints: number = 0;
  @Input() disabled: boolean = false;
  @Output() taskPointsChange = new EventEmitter<number>();

  onPointsChange(newValue: number): void {
    this.taskPoints = newValue;
    this.taskPointsChange.emit(this.taskPoints);
  }
}