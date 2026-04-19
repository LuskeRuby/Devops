import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { UserService } from '../../../../services/user.service';
import { TaskDTO } from '../../models/TaskDto';
import { TaskcardComponent } from '../taskcard/taskcard';
import { CalendarEventService } from '../../../../services/calendar-event.service';
import { PointsStore } from '../../../../services/points-store.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [TaskcardComponent],
  templateUrl: './task-list.html',
  styleUrls: ['./task-list.scss'],
})
export class TaskListComponent implements OnInit {
  private userService = inject(UserService);
  private calendarEventService = inject(CalendarEventService);
  private pointsStore = inject(PointsStore);

  tasks = signal<TaskDTO[]>([]);

  currentUser = computed(() => this.userService.currentUser());

  ngOnInit(): void {
    const user = this.currentUser();
    if (user) {
      this.loadTasks(user.id);
    }
  }

  loadTasks(userId: number): void {
    this.userService.getTasksByUserId(userId).subscribe({
      next: (data) => this.tasks.set(data),
      error: (err) => console.error('Error fetching tasks', err),
    });
  }

  handleTaskToggle(clickedTask: TaskDTO) {
    const originalChecked = clickedTask.checked;
    const userId = this.currentUser()?.id;

    this.tasks.update((tasks) =>
      tasks.map((t) => (t.id === clickedTask.id ? { ...t, checked: !originalChecked } : t)),
    );

    const action$ = !originalChecked
      ? this.calendarEventService.completeEvent(clickedTask.id)
      : this.calendarEventService.uncompleteEvent(clickedTask.id);

    action$.subscribe({
      next: () => {
        if (userId) {
          this.loadTasks(userId);
          this.pointsStore.loadUser(userId);
        }
      },
      error: (err) => {
        console.error('Task update failed:', err);

        this.tasks.update((tasks) =>
          tasks.map((t) => (t.id === clickedTask.id ? { ...t, checked: originalChecked } : t)),
        );
      },
    });
  }
}
