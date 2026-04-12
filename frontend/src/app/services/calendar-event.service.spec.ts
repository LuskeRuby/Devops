import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CalendarEventService, CalendarQuickCreatePayload } from './calendar-event.service';

describe('CalendarEventService', () => {
  let service: CalendarEventService;
  let http: HttpTestingController;

  const mockTaskDTO = {
    id: 1,
    name: 'Test Task',
    description: 'Details',
    points: 10,
    checked: false,
    timestamp: '2026-04-10T08:00:00',
    repeatUntil: '2026-04-10T09:00:00',
    assignedUserIds: [1],
    assignedUserNames: ['Anders']
  };

  const mockPayload: CalendarQuickCreatePayload = {
    title: 'Meeting',
    description: 'Weekly sync',
    start: new Date('2026-04-10T08:00:00'),
    end: new Date('2026-04-10T09:00:00'),
    userIds: [1, 2],
    points: 5,
    color: '#2563eb',
    isSeparateTasks: false
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CalendarEventService]
    });

    service = TestBed.inject(CalendarEventService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  // ---------------- loadFamilyEvents ----------------

  it('should GET /api/tasks/family/{email} with requesterId', () => {
    service.loadFamilyEvents('fam@test.com', 1).subscribe();

    const req = http.expectOne('/api/tasks/family/fam@test.com?requesterId=1');
    expect(req.request.method).toBe('GET');
    req.flush([mockTaskDTO]);
  });

  it('should GET /api/tasks/family/{email} without requesterId', () => {
    service.loadFamilyEvents('fam@test.com').subscribe();

    const req = http.expectOne('/api/tasks/family/fam@test.com');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should map TaskDTOs to CalendarEvents', () => {
    let result: any[] = [];
    service.loadFamilyEvents('fam@test.com', 1).subscribe(events => (result = events));

    http.expectOne('/api/tasks/family/fam@test.com?requesterId=1').flush([mockTaskDTO]);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
    expect(result[0].title).toBe('Test Task');
  });

  // ---------------- loadUserEvents ----------------

  it('should GET /api/users/{id}/tasks with requesterId', () => {
    service.loadUserEvents(2, 1).subscribe();

    const req = http.expectOne('/api/users/2/tasks?requesterId=1');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should GET /api/users/{id}/tasks without requesterId', () => {
    service.loadUserEvents(2).subscribe();

    const req = http.expectOne('/api/users/2/tasks');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should map user events with correct meta', () => {
    let result: any[] = [];
    service.loadUserEvents(2, 1).subscribe(events => (result = events));

    http.expectOne('/api/users/2/tasks?requesterId=1').flush([mockTaskDTO]);

    expect(result[0].meta.taskId).toBe(1);
    expect(result[0].meta.points).toBe(10);
  });

  // ---------------- createEvent ----------------

  it('should POST to /api/tasks with requesterId', () => {
    service.createEvent(mockPayload, 1).subscribe();

    const req = http.expectOne('/api/tasks?requesterId=1');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.task.name).toBe('Meeting');
    expect(req.request.body.userIds).toEqual([1, 2]);
    req.flush(mockTaskDTO);
  });

  it('should POST to /api/tasks without requesterId', () => {
    service.createEvent(mockPayload).subscribe();

    const req = http.expectOne('/api/tasks');
    expect(req.request.method).toBe('POST');
    req.flush(mockTaskDTO);
  });

  it('should include separateTasks in POST body', () => {
    service.createEvent({ ...mockPayload, isSeparateTasks: true }, 1).subscribe();

    const req = http.expectOne('/api/tasks?requesterId=1');
    expect(req.request.body.separateTasks).toBe(true);
    req.flush(mockTaskDTO);
  });

  // ---------------- updateEvent ----------------

  it('should PUT to /api/tasks/{id} with requesterId', () => {
    service.updateEvent(5, mockPayload, 1).subscribe();

    const req = http.expectOne('/api/tasks/5?requesterId=1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.task.name).toBe('Meeting');
    req.flush(mockTaskDTO);
  });

  it('should PUT to /api/tasks/{id} without requesterId', () => {
    service.updateEvent(5, mockPayload).subscribe();

    const req = http.expectOne('/api/tasks/5');
    expect(req.request.method).toBe('PUT');
    req.flush(mockTaskDTO);
  });

  // ---------------- completeEvent ----------------

  it('should PUT to /api/tasks/{id}/complete with requesterId', () => {
    service.completeEvent(3, 1).subscribe();

    const req = http.expectOne('/api/tasks/3/complete?requesterId=1');
    expect(req.request.method).toBe('PUT');
    req.flush(mockTaskDTO);
  });

  it('should PUT to /api/tasks/{id}/complete without requesterId', () => {
    service.completeEvent(3).subscribe();

    const req = http.expectOne('/api/tasks/3/complete');
    req.flush(mockTaskDTO);
  });

  // ---------------- uncompleteEvent ----------------

  it('should PUT to /api/tasks/{id}/uncomplete with requesterId', () => {
    service.uncompleteEvent(3, 1).subscribe();

    const req = http.expectOne('/api/tasks/3/uncomplete?requesterId=1');
    expect(req.request.method).toBe('PUT');
    req.flush(mockTaskDTO);
  });

  it('should PUT to /api/tasks/{id}/uncomplete without requesterId', () => {
    service.uncompleteEvent(3).subscribe();

    const req = http.expectOne('/api/tasks/3/uncomplete');
    req.flush(mockTaskDTO);
  });

  // ---------------- deleteEvent ----------------

  it('should DELETE /api/tasks/{id}', () => {
    service.deleteEvent(7).subscribe();

    const req = http.expectOne('/api/tasks/7');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ---------------- toCalendarEvent mapping ----------------

  it('should default start to current date when timestamp is missing', () => {
    let result: any[] = [];
    service.loadFamilyEvents('f@f.com', 1).subscribe(events => (result = events));

    http.expectOne('/api/tasks/family/f@f.com?requesterId=1')
      .flush([{ ...mockTaskDTO, timestamp: undefined }]);

    expect(result[0].start).toBeInstanceOf(Date);
  });

  it('should default end to start + 1 hour when repeatUntil is missing', () => {
    let result: any[] = [];
    service.loadFamilyEvents('f@f.com', 1).subscribe(events => (result = events));

    http.expectOne('/api/tasks/family/f@f.com?requesterId=1')
      .flush([{ ...mockTaskDTO, repeatUntil: undefined }]);

    const event = result[0];
    expect(event.end.getTime() - event.start.getTime()).toBe(60 * 60 * 1000);
  });

  it('should set draggable=false for checked tasks', () => {
    let result: any[] = [];
    service.loadFamilyEvents('f@f.com', 1).subscribe(events => (result = events));

    http.expectOne('/api/tasks/family/f@f.com?requesterId=1')
      .flush([{ ...mockTaskDTO, checked: true }]);

    expect(result[0].draggable).toBe(false);
    expect(result[0].resizable.beforeStart).toBe(false);
    expect(result[0].resizable.afterEnd).toBe(false);
  });

  it('should set draggable=true for unchecked tasks', () => {
    let result: any[] = [];
    service.loadFamilyEvents('f@f.com', 1).subscribe(events => (result = events));

    http.expectOne('/api/tasks/family/f@f.com?requesterId=1')
      .flush([{ ...mockTaskDTO, checked: false }]);

    expect(result[0].draggable).toBe(true);
    expect(result[0].resizable.beforeStart).toBe(true);
  });

  it('should map meta fields correctly', () => {
    let result: any[] = [];
    service.loadFamilyEvents('f@f.com', 1).subscribe(events => (result = events));

    http.expectOne('/api/tasks/family/f@f.com?requesterId=1').flush([
      { ...mockTaskDTO, assignedUserIds: [1, 2], assignedUserNames: ['A', 'B'], points: 20 }
    ]);

    expect(result[0].meta.assignedUserIds).toEqual([1, 2]);
    expect(result[0].meta.assignedUserNames).toEqual(['A', 'B']);
    expect(result[0].meta.points).toBe(20);
  });

  it('should default assignedUserIds and assignedUserNames to empty arrays when missing', () => {
    let result: any[] = [];
    service.loadFamilyEvents('f@f.com', 1).subscribe(events => (result = events));

    http.expectOne('/api/tasks/family/f@f.com?requesterId=1').flush([
      { ...mockTaskDTO, assignedUserIds: undefined, assignedUserNames: undefined }
    ]);

    expect(result[0].meta.assignedUserIds).toEqual([]);
    expect(result[0].meta.assignedUserNames).toEqual([]);
  });
});
