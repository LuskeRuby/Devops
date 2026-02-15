import { FormsModule } from '@angular/forms'; 
import { Component } from '@angular/core';

@Component({
  selector: 'app-points-input', 
  standalone: true,
  imports: [FormsModule], 
  templateUrl: './points-input.html', 
  styleUrl: './points-input.scss'    
})
export class PointsInputComponent {
  taskPoints: number = 0;
}