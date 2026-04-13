import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { TaskPageComponent } from './task-page';
import { TaskService } from '../../services/task.service';
import { UserService } from '../../services/user.service';
import { PointsStore } from '../../services/points-store.service';

@Component({ selector: 'app-points-input', standalone: true, template: '' })
class MockPointsInputComponent {
  @Input() taskPoints = 0;
}

describe('TaskPageComponent', () => {
  let component: TaskPageComponent;
  let fixture: ComponentFixture<TaskPageComponent>;

  let taskService: any;
  let userService: any;
  let pointsStore: any;

  const mockParent = { id: 1, name: 'Anders', role: 'PARENT', familyEmail: 'test@family.com' };
  const mockChild = { id: 2, name: 'Maja', role: 'CHILD', familyEmail: 'test@family.com' };

  const mockTask = {
    id: 1,
    name: 'Clean room',
    description: '',
    points: 10,
    checked: false,
    timestamp: '2026-04-12T08:00:00',
    assignedUserIds: [1],
    assignedUserNames: ['Anders'],
  };

  const setupModule = async (
    currentUser: any = mockParent,
    queryParams: Record<string, string> = {},
  ) => {
    taskService = {
      getTasksForFamily: vi.fn().mockReturnValue(of([mockTask])),
      getTasksForUser: vi.fn().mockReturnValue(of([mockTask])),
      createTask: vi.fn().mockReturnValue(of(mockTask)),
      completeTask: vi.fn().mockReturnValue(of({ ...mockTask, checked: true })),
      uncompleteTask: vi.fn().mockReturnValue(of({ ...mockTask, checked: false })),
    };

    userService = {
      currentUser: vi.fn().mockReturnValue(currentUser),
      getUsersByFamilyEmail: vi.fn().mockReturnValue(of([mockParent])),
    };

    pointsStore = { loadUser: vi.fn() };

    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [TaskPageComponent, ReactiveFormsModule],
      providers: [
        { provide: TaskService, useValue: taskService },
        { provide: UserService, useValue: userService },
        { provide: PointsStore, useValue: pointsStore },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: { get: (key: string) => queryParams[key] ?? null },
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(TaskPageComponent, {
        set: { imports: [CommonModule, ReactiveFormsModule, MockPointsInputComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TaskPageComponent);
    component = fixture.componentInstance;
  };

  beforeEach(async () => {
    await setupModule();
  });

  // ---------------- BASICS ----------------

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------- ngOnInit ----------------

  it('should set currentUser and familyEmail on init', () => {
    fixture.detectChanges();
    expect(component.currentUser?.name).toBe('Anders');
    expect(component.familyEmail).toBe('test@family.com');
  });

  it('should patch form name from title query param', async () => {
    await setupModule(mockParent, { title: 'Prefilled task' });
    fixture.detectChanges();
    expect(component.taskForm.value.name).toBe('Prefilled task');
  });

  it('should not patch form when no title query param', () => {
    fixture.detectChanges();
    expect(component.taskForm.value.name).toBe('');
  });

  // ---------------- isParent ----------------

  it('should return true for isParent when role is PARENT', () => {
    fixture.detectChanges();
    expect(component.isParent).toBe(true);
  });

  it('should return false for isParent when role is CHILD', async () => {
    await setupModule(mockChild);
    fixture.detectChanges();
    expect(component.isParent).toBe(false);
  });

  // ---------------- loadUsers ----------------

  it('should load family users on init', () => {
    fixture.detectChanges();
    expect(userService.getUsersByFamilyEmail).toHaveBeenCalledWith('test@family.com');
    expect(component.users.length).toBe(1);
  });

  it('should set users to empty when no familyEmail', async () => {
    await setupModule({ ...mockParent, familyEmail: '' });
    fixture.detectChanges();
    expect(component.users).toEqual([]);
  });

  // ---------------- loadTasks ----------------

  it('should call getTasksForFamily for PARENT on init', () => {
    fixture.detectChanges();
    expect(taskService.getTasksForFamily).toHaveBeenCalledWith('test@family.com', 1);
  });

  it('should call getTasksForUser for CHILD on init', async () => {
    await setupModule(mockChild);
    fixture.detectChanges();
    expect(taskService.getTasksForUser).toHaveBeenCalledWith(2, 2);
  });

  it('should not load tasks when userId is missing', async () => {
    await setupModule(null);
    fixture.detectChanges();
    expect(taskService.getTasksForFamily).not.toHaveBeenCalled();
    expect(taskService.getTasksForUser).not.toHaveBeenCalled();
  });

  // ---------------- toggleUser ----------------

  it('should add userId when not already selected', () => {
    component.selectedUserIds = [];
    component.toggleUser(3);
    expect(component.selectedUserIds).toContain(3);
  });

  it('should remove userId when already selected', () => {
    component.selectedUserIds = [1, 2];
    component.toggleUser(1);
    expect(component.selectedUserIds).not.toContain(1);
    expect(component.selectedUserIds).toContain(2);
  });

  // ---------------- createTask ----------------

  it('should not call taskService when no users selected', () => {
    fixture.detectChanges();
    component.selectedUserIds = [];
    component.createTask();
    expect(taskService.createTask).not.toHaveBeenCalled();
  });

  it('should not call taskService when form is invalid', () => {
    fixture.detectChanges();
    component.selectedUserIds = [1];
    component.taskForm.patchValue({ name: '' });
    component.createTask();
    expect(taskService.createTask).not.toHaveBeenCalled();
  });

  it('should call taskService.createTask with correct payload', () => {
    fixture.detectChanges();
    component.selectedUserIds = [1];
    component.taskForm.patchValue({
      name: 'New chore',
      description: 'Details',
      points: 5,
      repeatEvery: 'Weekly',
    });

    component.createTask();

    expect(taskService.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New chore',
        description: 'Details',
        points: 5,
        repeatEvery: 'Weekly',
      }),
      [1],
      1,
    );
  });

  it('should reset form and reload tasks after successful createTask', () => {
    fixture.detectChanges();
    component.selectedUserIds = [1];
    component.taskForm.patchValue({ name: 'Chore', points: 5 });

    component.createTask();

    expect(component.taskForm.value.name).toBe('');
    expect(component.selectedUserIds).toEqual([]);
    // called once on init, once after create
    expect(taskService.getTasksForFamily).toHaveBeenCalledTimes(2);
  });

  // ---------------- toggleTaskStatus ----------------

  it('should call completeTask when task is unchecked', () => {
    fixture.detectChanges();
    component.toggleTaskStatus({ ...mockTask, checked: false });
    expect(taskService.completeTask).toHaveBeenCalledWith(1, 1);
  });

  it('should call uncompleteTask when task is checked', () => {
    fixture.detectChanges();
    component.toggleTaskStatus({ ...mockTask, checked: true });
    expect(taskService.uncompleteTask).toHaveBeenCalledWith(1, 1);
  });

  it('should reload tasks and refresh points after toggle', () => {
    fixture.detectChanges();
    component.toggleTaskStatus({ ...mockTask, checked: false });
    expect(pointsStore.loadUser).toHaveBeenCalledWith(1);
    // called once on init, once after toggle
    expect(taskService.getTasksForFamily).toHaveBeenCalledTimes(2);
  });

  it('should do nothing when userId is missing on toggleTaskStatus', async () => {
    await setupModule(null);
    fixture.detectChanges();
    component.toggleTaskStatus(mockTask as any);
    expect(taskService.completeTask).not.toHaveBeenCalled();
    expect(taskService.uncompleteTask).not.toHaveBeenCalled();
  });

  it('should do nothing when task has no id on toggleTaskStatus', () => {
    fixture.detectChanges();
    component.toggleTaskStatus({ ...mockTask, id: undefined } as any);
    expect(taskService.completeTask).not.toHaveBeenCalled();
  });
});
