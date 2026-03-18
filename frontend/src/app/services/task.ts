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

  constructor(private http: HttpClient) { }

  createTask(task: Task, userIds: number[]): Observable<Task> {
    return this.http.post<Task>(this.baseUrl, {
      task,
      userIds
    });
  }

  getTasksForUser(userId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.baseUrl}/user/${userId}`);
  }

  completeTask(taskId: number): Observable<Task> {
    return this.http.put<Task>(`${this.baseUrl}/${taskId}/complete`, {});
  }

  getTasksForFamily(familyEmail: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.baseUrl}/family/${familyEmail}`);
  }
}
