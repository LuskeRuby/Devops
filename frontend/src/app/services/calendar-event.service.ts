import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CalendarEvent } from 'angular-calendar';
import { TaskDTO } from '../features/task/models/TaskDto';

export interface CalendarQuickCreatePayload {
  title: string;
  description: string;
  start: Date;
  end: Date;
  userIds: number[];
}

@Injectable({ providedIn: 'root' })
export class CalendarEventService {

  private tasksUrl = 'http://localhost:8080/api/tasks';
  private usersUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}

  /** Load all tasks for a family (shared family calendar view) */
  loadFamilyEvents(familyEmail: string): Observable<CalendarEvent[]> {
    return this.http
      .get<TaskDTO[]>(`${this.tasksUrl}/family/${familyEmail}`)
      .pipe(map(tasks => tasks.map(t => this.toCalendarEvent(t))));
  }

  /** Load tasks assigned to a single user (fallback if no familyEmail) */
  loadUserEvents(userId: number): Observable<CalendarEvent[]> {
    return this.http
      .get<TaskDTO[]>(`${this.usersUrl}/${userId}/tasks`)
      .pipe(map(tasks => tasks.map(t => this.toCalendarEvent(t))));
  }

  /** Create a new calendar event (persisted as a Task) */
  createEvent(payload: CalendarQuickCreatePayload): Observable<TaskDTO> {
    const body = {
      task: {
        name: payload.title,
        description: payload.description,
        timestamp: payload.start.toISOString(),
        repeatUntil: payload.end.toISOString(),
        points: 0,
        checked: false,
        repeatEvery: null
      },
      userIds: payload.userIds
    };

    return this.http.post<TaskDTO>(this.tasksUrl, body);
  }

  completeEvent(id: number): Observable<TaskDTO> {
    return this.http.put<TaskDTO>(`${this.tasksUrl}/${id}/complete`, {});
  }

  /** Delete a calendar event by its task ID */
  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.tasksUrl}/${id}`);
  }

  /** Map a TaskDTO to an angular-calendar CalendarEvent */
  private toCalendarEvent(task: TaskDTO): CalendarEvent {
    const start = new Date(task.timestamp);
    const end = task.repeatUntil
      ? new Date(task.repeatUntil)
      : new Date(start.getTime() + 60 * 60 * 1000);

    return {
      id: task.id,
      title: task.name,
      start,
      end,
      draggable: !task.checked,
      resizable: {
        beforeStart: !task.checked,
        afterEnd: !task.checked
      },
      meta: {
        description: task.description,
        taskId: task.id,
        checked: task.checked,
        assignedUserIds: task.assignedUserIds ?? [],
        assignedUserNames: task.assignedUserNames ?? []
      },
      color: {
        primary: task.checked ? '#9e9e9e' : '#4285f4',
        secondary: task.checked ? '#e0e0e0' : '#D1E8FF'
      }
    };
  }
}

