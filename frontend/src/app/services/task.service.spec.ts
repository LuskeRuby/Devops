import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService, Task } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  let http: HttpTestingController;

  const mockTask: Task = {
    id: 1,
    name: 'Clean room',
    description: 'Tidy up',
    points: 10,
    timestamp: '2026-04-12T08:00:00',
    repeatEvery: 'Daily',
    checked: false
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService]
    });

    service = TestBed.inject(TaskService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  // ---------------- createTask ----------------

  it('should POST to /api/tasks with requesterId', () => {
    service.createTask(mockTask, [1, 2], 1).subscribe();

    const req = http.expectOne('/api/tasks?requesterId=1');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.task.name).toBe('Clean room');
    expect(req.request.body.userIds).toEqual([1, 2]);
    req.flush(mockTask);
  });

  it('should POST to /api/tasks without requesterId', () => {
    service.createTask(mockTask, [1]).subscribe();

    const req = http.expectOne('/api/tasks');
    expect(req.request.method).toBe('POST');
    req.flush(mockTask);
  });

  // ---------------- getTasksForUser ----------------

  it('should GET /api/tasks/user/{id} with requesterId', () => {
    service.getTasksForUser(2, 1).subscribe();

    const req = http.expectOne('/api/tasks/user/2?requesterId=1');
    expect(req.request.method).toBe('GET');
    req.flush([mockTask]);
  });

  it('should GET /api/tasks/user/{id} without requesterId', () => {
    service.getTasksForUser(2).subscribe();

    const req = http.expectOne('/api/tasks/user/2');
    expect(req.request.method).toBe('GET');
    req.flush([mockTask]);
  });

  it('should return task list for user', () => {
    let result: Task[] = [];
    service.getTasksForUser(2, 1).subscribe(tasks => (result = tasks));

    http.expectOne('/api/tasks/user/2?requesterId=1').flush([mockTask]);

    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Clean room');
  });

  // ---------------- getTasksForFamily ----------------

  it('should GET /api/tasks/family/{email} with requesterId', () => {
    service.getTasksForFamily('fam@test.com', 1).subscribe();

    const req = http.expectOne('/api/tasks/family/fam@test.com?requesterId=1');
    expect(req.request.method).toBe('GET');
    req.flush([mockTask]);
  });

  it('should GET /api/tasks/family/{email} without requesterId', () => {
    service.getTasksForFamily('fam@test.com').subscribe();

    const req = http.expectOne('/api/tasks/family/fam@test.com');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should return task list for family', () => {
    let result: Task[] = [];
    service.getTasksForFamily('fam@test.com', 1).subscribe(tasks => (result = tasks));

    http.expectOne('/api/tasks/family/fam@test.com?requesterId=1').flush([mockTask]);

    expect(result.length).toBe(1);
    expect(result[0].points).toBe(10);
  });

  // ---------------- completeTask ----------------

  it('should PUT to /api/tasks/{id}/complete with requesterId', () => {
    service.completeTask(3, 1).subscribe();

    const req = http.expectOne('/api/tasks/3/complete?requesterId=1');
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockTask, checked: true });
  });

  it('should PUT to /api/tasks/{id}/complete without requesterId', () => {
    service.completeTask(3).subscribe();

    const req = http.expectOne('/api/tasks/3/complete');
    expect(req.request.method).toBe('PUT');
    req.flush(mockTask);
  });

  // ---------------- uncompleteTask ----------------

  it('should PUT to /api/tasks/{id}/uncomplete with requesterId', () => {
    service.uncompleteTask(3, 1).subscribe();

    const req = http.expectOne('/api/tasks/3/uncomplete?requesterId=1');
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockTask, checked: false });
  });

  it('should PUT to /api/tasks/{id}/uncomplete without requesterId', () => {
    service.uncompleteTask(3).subscribe();

    const req = http.expectOne('/api/tasks/3/uncomplete');
    expect(req.request.method).toBe('PUT');
    req.flush(mockTask);
  });
});
