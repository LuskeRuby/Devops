import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-total-points-display',
  standalone: true,
  templateUrl: './total-points-display.html',
  styleUrl: './total-points-display.scss'
})
export class TotalPointsDisplayComponent {
  currentLevelPoints: number = 0;

  @Input() totalPoints: number = 0; 
  @Input() targetPoints: number = 100;

 get totalRewards(): number {
    // This increases by 1 for every 100 points earned (Milestone reach)
    return Math.floor(this.totalPoints / this.targetPoints);
  }

  get progress(): number {
    // This calculates the points remaining in the current level (0-99 range)
    this.currentLevelPoints = this.totalPoints % this.targetPoints; 
    
    // This converts the current level points into a percentage to control the progress bar width
    return (this.currentLevelPoints / this.targetPoints) * 100; 
  }
}