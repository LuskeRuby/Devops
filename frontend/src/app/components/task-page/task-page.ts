import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService, Task } from '../../services/task';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-task-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-page.html',
  styleUrl: './task-page.scss'
})
export class TaskPageComponent {

  tasks: Task[] = [];
  taskForm: FormGroup;

  constructor(
    private taskService: TaskService,
    private fb: FormBuilder
  ) {
    this.taskForm = this.fb.group({
      name: [''],
      description: [''],
      points: [0],
      repeatEvery: ['Daily']
    });
  }

  createTask() {

    const formValue = this.taskForm.value;

    this.taskService.createTask(
      {
        name: formValue.name,
        description: formValue.description,
        points: formValue.points,
        timestamp: new Date().toISOString(),
        repeatEvery: formValue.repeatEvery
      },
      [1] // still hardcoded user for now
    ).subscribe(() => {
      this.taskForm.reset({
        name: '',
        description: '',
        points: 0,
        repeatEvery: 'Daily'
      });
      this.loadTasks();
    });
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
