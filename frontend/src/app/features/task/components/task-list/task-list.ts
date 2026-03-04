import { Component, signal } from '@angular/core';
import { UserService } from '../../../../services/user.service';
import { TaskDTO } from '../../models/TaskDto';
import { TaskcardComponent } from '../taskcard/taskcard';


@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [TaskcardComponent],
  templateUrl: './task-list.html',
  styleUrls: ['./task-list.scss']
})
export class TaskListComponent {

  tasks = signal<TaskDTO[]>([]);

  userId = 1;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getTasksByUserId(this.userId).subscribe({
      next: (data) => this.tasks.set(data),
      error: (err) => console.error('Error fetching tasks', err)
    });
  }

  handleTaskToggle(clickedTask: TaskDTO) {
    clickedTask.checked = !clickedTask.checked;
    this.tasks.update(tasks => tasks.map(task => task.id === clickedTask.id ? clickedTask : task));
  }
}