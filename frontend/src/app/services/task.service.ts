import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Task {
  id?: number;
  name: string;
  description: string;
  points: number;
  timestamp: string;
  repeatEvery?: string;
  checked?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private baseUrl = '/api/tasks';

  constructor(private http: HttpClient) {}

  createTask(task: Task, userIds: number[], requesterId?: number): Observable<Task> {
    const url = requesterId ? `${this.baseUrl}?requesterId=${requesterId}` : this.baseUrl;
    return this.http.post<Task>(url, {
      task,
      userIds
    });
  }

  getTasksForUser(userId: number, requesterId?: number): Observable<Task[]> {
    const url = requesterId ? `${this.baseUrl}/user/${userId}?requesterId=${requesterId}` : `${this.baseUrl}/user/${userId}`;
    return this.http.get<Task[]>(url);
  }

  completeTask(taskId: number, requesterId?: number): Observable<Task> {
    const url = requesterId ? `${this.baseUrl}/${taskId}/complete?requesterId=${requesterId}` : `${this.baseUrl}/${taskId}/complete`;
    return this.http.put<Task>(url, {});
  }

  getTasksForFamily(familyEmail: string, requesterId?: number): Observable<Task[]> {
    const url = requesterId ? `${this.baseUrl}/family/${familyEmail}?requesterId=${requesterId}` : `${this.baseUrl}/family/${familyEmail}`;
    return this.http.get<Task[]>(url);
  }
}
