import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService, Task } from '../../services/task';

@Component({
  selector: 'app-task-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-page.html',
  styleUrl: './task-page.scss'
})
export class TaskPageComponent {

  tasks: Task[] = [];

  constructor(private taskService: TaskService) {}

  createTask() {
    this.taskService.createTask(
      {
        name: 'Ny Opgave',
        description: 'Test opgave',
        points: 10,
        timestamp: new Date().toISOString(),
        repeatEvery: 'Daily'
      },
      [1] // temporary hardcoded user
    ).subscribe(() => this.loadTasks());
  }

  loadTasks() {
    this.taskService.getTasksForUser(1).subscribe(res => {
      this.tasks = res;
    });
  }

  completeTask(id: number) {
    this.taskService.completeTask(id).subscribe(() => {
      this.loadTasks();
    });
  }
}
