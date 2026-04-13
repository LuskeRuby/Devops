import { Component, inject } from '@angular/core';
import { PointsStore } from '../../services/points-store.service';

@Component({
  selector: 'app-rewards-display',
  standalone: true,
  templateUrl: './rewards-display.component.html',
  styleUrl: './rewards-display.component.scss',
})
export class RewardsDisplayComponent {
  readonly pointsStore = inject(PointsStore);

  totalRewards = this.pointsStore.totalRewards;
}
