import { Injectable, computed, inject, signal } from '@angular/core';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class PointsStore {
  private userService = inject(UserService);

  // Base signals
  totalPoints = signal(0);
  targetPoints = signal(1);

  safeTarget = computed(() => Math.max(this.targetPoints() ?? 0, 1));
  currentLevelPoints = computed(() => this.totalPoints() % this.safeTarget());
  progress = computed(() => (this.currentLevelPoints() / this.targetPoints()) * 100);  
  totalRewards = computed(() => Math.floor(this.totalPoints() / this.safeTarget()));

  setTotalPoints(value: number) {
    this.totalPoints.set(Math.max(0, value ?? 0));
  }

  addPoints(delta: number) {
    this.totalPoints.update((v) => Math.max(0, v + (delta ?? 0)));
  }

  setTargetPoints(value: number) {
    this.targetPoints.set(Math.max(1, value ?? 1));
  }

  loadUser(userId: number) {
    this.userService.getUser(userId).subscribe({
      next: (user) => {
        this.setTotalPoints(user.totalPoints ?? 0);
        this.setTargetPoints(user.targetPoints ?? 1);        
      },
      error: (err) => {
        console.warn('PointsStore.loadUser failed', err);
      },
    });
  }
}
