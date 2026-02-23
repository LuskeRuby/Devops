import { Component, computed, input, Input } from '@angular/core';

@Component({
  selector: 'app-total-points-display',
  standalone: true,
  templateUrl: './total-points-display.html',
  styleUrl: './total-points-display.scss'
})
export class TotalPointsDisplayComponent {


  totalPoints = input<number>(0); 
  targetPoints = input<number>(100);


  totalRewards = computed(() => {
    return Math.floor(this.totalPoints() / this.targetPoints());
  });

  currentLevelPoints = computed(() => {
    return this.totalPoints() % this.targetPoints();
  });

  progress = computed(() => {
    return (this.currentLevelPoints() / this.targetPoints()) * 100;
  });
}