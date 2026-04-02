import { Component, inject, input, OnInit, OnDestroy } from '@angular/core';
import { LucideAngularModule, Plus, Minus } from 'lucide-angular';
import { User, UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-member-point-editor',
  standalone: true,
  imports: [LucideAngularModule, CommonModule],
  templateUrl: 'member-point-editor.html',
  styleUrl: 'member-point-editor.scss'
})
export class MemberPointEditorComponent implements OnInit, OnDestroy {
  member = input.required<User>();
  userService = inject(UserService);

  readonly PlusIcon = Plus;
  readonly MinusIcon = Minus;

  private pointsSubject = new Subject<number>();
  private pointsSubscription?: Subscription;
  private accumulatedDelta = 0;

  ngOnInit() {
    this.pointsSubscription = this.pointsSubject.pipe(
      debounceTime(400)
    ).subscribe(() => {
      const deltaToSend = this.accumulatedDelta;
      if (deltaToSend !== 0) {
        this.accumulatedDelta = 0;
        this.userService.addPoints(this.member().id, deltaToSend).subscribe({
          next: () => {},
          error: (err: any) => {
            console.error('Failed to update points', err);
            // Revert exactly the amount on error
            this.member().totalPoints = (this.member().totalPoints || 0) - deltaToSend;
          }
        });
      }
    });
  }

  ngOnDestroy() {
    this.pointsSubscription?.unsubscribe();
  }

  get totalRewards(): number {
    return Math.floor((this.member().totalPoints || 0) / 100);
  }

  adjustPoints(rewardDelta: number) {
    const currentPoints = this.member().totalPoints || 0;
    const pointDelta = rewardDelta * 100;
    
    // Prevent the number of rewards from falling below 0
    if (this.totalRewards + rewardDelta < 0) {
      return;
    }

    // Optimistically update the UI instantly
    this.member().totalPoints = currentPoints + pointDelta;
    
    // Accumulate the delta and push to the debouncer
    this.accumulatedDelta += pointDelta;
    this.pointsSubject.next(pointDelta);
  }
}
