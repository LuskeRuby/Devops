import { Injectable, inject } from '@angular/core';
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
  imageId?: number;
  color: string;
}

@Injectable({ providedIn: 'root' })
export class CalendarEventService {
  private http = inject(HttpClient);

  private tasksUrl = '/api/tasks';
  private usersUrl = '/api/users';

  /** Load all tasks for a family (shared family calendar view) */
  loadFamilyEvents(familyEmail: string) {
    const url = `${this.tasksUrl}/family/${familyEmail}`;
    return this.http
      .get<TaskDTO[]>(url)
      .pipe(map((tasks) => tasks.map((task) => this.toCalendarEvent(task))));
  }

  /** Load tasks assigned to a single user (fallback if no familyEmail) */
  loadUserEvents(userId: number): Observable<CalendarEvent<CalendarTaskMeta>[]> {
    const url = `${this.usersUrl}/${userId}/tasks`;
    return this.http
      .get<TaskDTO[]>(url)
      .pipe(map((tasks) => tasks.map((t) => this.toCalendarEvent(t))));
  }

  /** Create a new calendar event (persisted as a TaskService) */
  createEvent(payload: CalendarQuickCreatePayload): Observable<TaskDTO> {
    const body = {
      task: {
        name: payload.title,
        description: payload.description,
        timestamp: this.toLocalDateTime(payload.start),
        repeatUntil: this.toLocalDateTime(payload.end),
        points: payload.points,
        imageId: payload.imageId,
        checked: false,
        repeatEvery: null,
      },
      userIds: payload.userIds,
      separateTasks: payload.isSeparateTasks,
    };

    return this.http.post<TaskDTO>(this.tasksUrl, body);
  }

  /** Update an existing calendar event (persisted TaskService) */
  updateEvent(taskId: number, payload: CalendarQuickCreatePayload): Observable<TaskDTO> {
    const body = {
      task: {
        name: payload.title,
        description: payload.description,
        timestamp: this.toLocalDateTime(payload.start),
        repeatUntil: this.toLocalDateTime(payload.end),
        points: payload.points,
        imageId: payload.imageId,
        checked: undefined,
        repeatEvery: null,
      },
      userIds: payload.userIds,
    };

    const url = `${this.tasksUrl}/${taskId}`;
    return this.http.put<TaskDTO>(url, body);
  }

  completeEvent(id: number): Observable<TaskDTO> {
    const url = `${this.tasksUrl}/${id}/complete`;
    return this.http.put<TaskDTO>(url, {});
  }

  uncompleteEvent(id: number): Observable<TaskDTO> {
    const url = `${this.tasksUrl}/${id}/uncomplete`;
    return this.http.put<TaskDTO>(url, {});
  }

  /** Delete a calendar event by its task ID */
  deleteEvent(id: number): Observable<void> {
    const url = `${this.tasksUrl}/${id}`;
    return this.http.delete<void>(url, {});
  }

  /** Map a TaskDTO to an angular-calendar CalendarEvent */
  private toCalendarEvent(task: TaskDTO): CalendarEvent {
    const start = task.timestamp ? new Date(task.timestamp) : new Date();

    const end = task.repeatUntil
      ? new Date(task.repeatUntil)
      : new Date(start.getTime() + 60 * 60 * 1000);

    const color = {
      primary: '#2563eb', // blue for active
      secondary: '#dbeafe ', // gray for done
    };

    const event = {
      id: task.id,
      title: task.name,
      start,
      end,
      draggable: !task.checked,
      resizable: {
        beforeStart: !task.checked,
        afterEnd: !task.checked,
      },
      meta: {
        description: task.description,
        taskId: task.id,
        checked: task.checked,
        assignedUserIds: task.assignedUserIds ?? [],
        assignedUserNames: task.assignedUserNames ?? [],
        points: task.points ?? 0,
        imageId: task.imageId,
      },
      color,
    };

    console.log('[CalendarEventService] Mapped task to Event:', {
      taskId: task.id,
      name: task.name,
      checked: task.checked,
      description: task.description,
    });

    return event;
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
