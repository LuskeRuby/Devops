import { Component, inject } from '@angular/core';
import { PointsStore } from '../../services/points-store.service';

@Component({
    selector: 'app-points-progress',
    standalone: true,
    templateUrl: './points-progress.component.html',
    styleUrl: './points-progress.component.scss'
})
export class PointsProgressComponent {
    
    readonly pointsStore = inject(PointsStore);

    // Expose derived signals from the shared store for the template
    currentLevelPoints = this.pointsStore.currentLevelPoints;
    progress = this.pointsStore.progress;
}
