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
    // Denne stiger med 1 for hver 100 point
    return Math.floor(this.totalPoints / this.targetPoints);
  }

  get progress(): number {
    // Denne sørger for at baren nulstilles og starter forfra
    this.currentLevelPoints = this.totalPoints % this.targetPoints;
    return (this.currentLevelPoints / this.targetPoints) * 100;
  }
}