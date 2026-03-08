import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TaskDTO } from '../features/task/models/TaskDto';

export interface User {
  id: number;
  name: string;
  email: string;
  totalPoints?: number;
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}


  getUser(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  addPoints(id: number, points: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/add-points/${points}`, {});
  }

 getUsersByFamilyEmail(familyEmail: string): Observable<User[]> {
   return this.http.get<User[]>(`${this.apiUrl}/family/${familyEmail}`);
 }

  getTasksByUserId(id: number): Observable<TaskDTO[]> {    
    return this.http.get<TaskDTO[]>(`${this.apiUrl}/${id}/tasks`);
  }
}
