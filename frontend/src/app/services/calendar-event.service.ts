import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CalendarEvent } from 'angular-calendar';
import { TaskDTO } from '../features/task/models/TaskDto';
import { CalendarTaskMeta } from '../features/task/models/CalendarTaskMeta';

export interface CalendarQuickCreatePayload {
  title: string;
  description: string;
  start: Date;
  end: Date;
  userIds: number[];
  isSeparateTasks?: boolean;
  points: number;
  color: string;
}


@Injectable({ providedIn: 'root' })
export class CalendarEventService {

  private tasksUrl = '/api/tasks';
  private usersUrl = '/api/users';

  constructor(private http: HttpClient) {}

  /** Load all tasks for a family (shared family calendar view) */
  loadFamilyEvents(familyEmail: string, requesterId?: number) {
    const url = requesterId ? `${this.tasksUrl}/family/${familyEmail}?requesterId=${requesterId}` : `${this.tasksUrl}/family/${familyEmail}`;
    return this.http
      .get<TaskDTO[]>(url)
      .pipe(
        map(tasks => tasks.map(task => this.toCalendarEvent(task)))
      );
  }

  /** Load tasks assigned to a single user (fallback if no familyEmail) */
  loadUserEvents(userId: number, requesterId?: number): Observable<CalendarEvent<CalendarTaskMeta>[]> {
    const url = requesterId ? `${this.usersUrl}/${userId}/tasks?requesterId=${requesterId}` : `${this.usersUrl}/${userId}/tasks`;
    return this.http
      .get<TaskDTO[]>(url)
      .pipe(map(tasks => tasks.map(t => this.toCalendarEvent(t))));
  }

  /** Create a new calendar event (persisted as a TaskService) */
  createEvent(payload: CalendarQuickCreatePayload, requesterId?: number): Observable<TaskDTO> {
    const body = {
      task: {
        name: payload.title,
        description: payload.description,
        timestamp: this.toLocalDateTime(payload.start),
        repeatUntil: this.toLocalDateTime(payload.end),
        points: payload.points,
        checked: false,
        repeatEvery: null
      },
      userIds: payload.userIds,
      separateTasks: payload.isSeparateTasks
    };

    const url = requesterId ? `${this.tasksUrl}?requesterId=${requesterId}` : this.tasksUrl;
    return this.http.post<TaskDTO>(url, body);
  }

  /** Update an existing calendar event (persisted TaskService) */
  updateEvent(taskId: number, payload: CalendarQuickCreatePayload, requesterId?: number): Observable<TaskDTO> {
    const body = {
      task: {
        name: payload.title,
        description: payload.description,
        timestamp: this.toLocalDateTime(payload.start),
        repeatUntil: this.toLocalDateTime(payload.end),
        points: payload.points,
        checked: undefined,
        repeatEvery: null
      },
      userIds: payload.userIds
    };

    const url = requesterId ? `${this.tasksUrl}/${taskId}?requesterId=${requesterId}` : `${this.tasksUrl}/${taskId}`;
    return this.http.put<TaskDTO>(url, body);
  }

  completeEvent(id: number, requesterId?: number): Observable<TaskDTO> {
    const url = requesterId ? `${this.tasksUrl}/${id}/complete?requesterId=${requesterId}` : `${this.tasksUrl}/${id}/complete`;
    return this.http.put<TaskDTO>(url, {});
  }

  uncompleteEvent(id: number, requesterId?: number): Observable<TaskDTO> {
    const url = requesterId ? `${this.tasksUrl}/${id}/uncomplete?requesterId=${requesterId}` : `${this.tasksUrl}/${id}/uncomplete`;
    return this.http.put<TaskDTO>(url, {});
  }

  /** Delete a calendar event by its task ID */
  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.tasksUrl}/${id}`);
  }

  /** Map a TaskDTO to an angular-calendar CalendarEvent */
  private toCalendarEvent(task: TaskDTO): CalendarEvent {
    const start = task.timestamp ? new Date(task.timestamp) : new Date();

    const end = task.repeatUntil
      ? new Date(task.repeatUntil)
      : new Date(start.getTime() + 60 * 60 * 1000);

    const color = {
      primary: '#2563eb', // blue for active
      secondary: '#dbeafe '// gray for done
    };

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
        assignedUserNames: task.assignedUserNames ?? [],
        points: task.points ?? 0
      },
      color
    };
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

