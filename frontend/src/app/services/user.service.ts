import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { TaskDTO } from '../features/task/models/TaskDto';

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  totalPoints?: number;
  avatarUrl?: string;
  familyEmail?: string;
}

const STORAGE_KEY = 'currentUser';

@Injectable({ providedIn: 'root' })
export class UserService {

  private apiUrl = 'http://localhost:8080/api/users';

  readonly currentUser = signal<User | null>(
    JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')
  );

  constructor(private http: HttpClient, private router: Router) {}

  setCurrentUser(user: User): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  logoutUser(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/select-member']);
  }

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

  validatePin(id: number, pin: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/${id}/validate-pin`, { pin });
  }
}
