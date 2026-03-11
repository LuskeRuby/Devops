import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService, Task } from '../../services/task';
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

  familyEmail = 'Asma@test.com';

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

    this.loadUsers();

    const title = this.route.snapshot.queryParamMap.get('title');

    if (title) {
      this.taskForm.patchValue({
        name: title
      });
    }
  }

  loadUsers(): void {
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
        timestamp: new Date().toISOString(),
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
}
