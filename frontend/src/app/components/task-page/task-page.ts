import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Task, TaskService} from '../../services/task.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService, User } from '../../services/user.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-task-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-page.html',
  styleUrl: './task-page.scss'
})
export class TaskPageComponent implements OnInit {

  tasks: Task[] = [];
  taskForm: FormGroup;

  users: User[] = [];
  selectedUserIds: number[] = [];

  familyEmail = '';

  constructor(
    private taskService: TaskService,
    private userService: UserService,
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.taskForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      points: [0, Validators.required],
      repeatEvery: ['Daily']
    });
  }

  ngOnInit(): void {
    console.log("TaskPage initialized");

    const currentUser = this.userService.currentUser();
    this.familyEmail = currentUser?.familyEmail ?? '';

    this.loadUsers();

    const title = this.route.snapshot.queryParamMap.get('title');

    if (title) {
      this.taskForm.patchValue({
        name: title
      });
    }
  }

  loadUsers(): void {
    if (!this.familyEmail) {
      this.users = [];
      return;
    }

    this.userService
      .getUsersByFamilyEmail(this.familyEmail)
      .subscribe(res => {
        this.users = res;
      });
  }

  toggleUser(userId: number): void {
    if (this.selectedUserIds.includes(userId)) {
      this.selectedUserIds = this.selectedUserIds.filter(id => id !== userId);
    } else {
      this.selectedUserIds.push(userId);
    }
  }

  createTask(): void {
    if (this.selectedUserIds.length === 0) {
      console.error("Please select at least one user");
      return;
    }

    if (this.taskForm.invalid) {
      console.error("Please fill in all required fields");
      return;
    }

    const formValue = this.taskForm.value;

    this.taskService.createTask(
      {
        name: formValue.name,
        description: formValue.description,
        points: formValue.points,
        timestamp: this.toLocalDateTime(new Date()),
        repeatEvery: formValue.repeatEvery
      },
      this.selectedUserIds
    ).subscribe(() => {
      this.taskForm.reset({
        name: '',
        description: '',
        points: 0,
        repeatEvery: 'Daily'
      });
      this.selectedUserIds = [];
      this.loadTasks();
    });
  }

  loadTasks(): void {
    this.taskService
      .getTasksForFamily(this.familyEmail)
      .subscribe(res => {
        this.tasks = res;
      });
  }

  completeTask(id: number): void {
    this.taskService.completeTask(id).subscribe(() => {
      this.loadTasks();
    });
  }

  private toLocalDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hour = `${date.getHours()}`.padStart(2, '0');
    const minute = `${date.getMinutes()}`.padStart(2, '0');
    const second = `${date.getSeconds()}`.padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }
}
