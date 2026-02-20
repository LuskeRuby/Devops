import { Component, computed, input, Input } from '@angular/core';

@Component({
  selector: 'app-total-points-display',
  standalone: true,
  templateUrl: './total-points-display.html',
  styleUrl: './total-points-display.scss'
})
export class TotalPointsDisplayComponent {

  // 1. Transform @Inputs into Signal Inputs
  totalPoints = input<number>(0); 
  targetPoints = input<number>(100);

  // 2. Use computed() for derived state (replaces getters)
  // These update automatically only when totalPoints or targetPoints change
  totalRewards = computed(() => {
    return Math.floor(this.totalPoints() / this.targetPoints());
  });

  currentLevelPoints = computed(() => {
    return this.totalPoints() % this.targetPoints();
  });

  progress = computed(() => {
    // We can even use other signals inside a computed!
    return (this.currentLevelPoints() / this.targetPoints()) * 100;
  });
}