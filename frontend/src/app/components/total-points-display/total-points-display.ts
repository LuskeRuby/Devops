import { Component, effect, inject, input } from '@angular/core';
import { PointsProgressComponent } from '../points-progress/points-progress.component';
import { RewardsDisplayComponent } from '../rewards-display/rewards-display.component';
import { PointsStore } from '../../services/points-store.service';

@Component({
  selector: 'app-total-points-display',
  standalone: true,
  imports: [PointsProgressComponent, RewardsDisplayComponent],
  templateUrl: './total-points-display.html',
  styleUrl: './total-points-display.scss',
})
export class TotalPointsDisplayComponent {
  totalPoints = input<number>(0);
  targetPoints = input<number>(1);
  userId = input<number | null>(null);

  private readonly pointsStore = inject(PointsStore);

  constructor() {
    effect(() => {
      const id = this.userId();
      if (id) {
        this.pointsStore.loadUser(id);
      }
    });
  }
}
