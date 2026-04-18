import { Injectable, signal, inject } from '@angular/core';
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
  imageId?: number;
  pincode?: string;
  family: {
    email: string;
  };
  familyEmail?: string;
}

const STORAGE_KEY = 'currentUser';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = '/api/users';

  readonly currentUser = signal<User | null>(
    JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null'),
  );

  setCurrentUser(user: User): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  logoutUser(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/select-member']);
  }

  editUser(user: User) {
    return this.http.put<User>(`${this.apiUrl}/${user.id}`, user);
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addPoints(id: number, points: number): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/${id}/add-points/${points}`, {});
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

  getImageUrl(imageId: number | undefined): string {
    if (!imageId) return 'assets/default-avatar.png';
    return `/api/images/${imageId}`;
  }

  uploadImage(file: File): Observable<number> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<number>('/api/images/upload', formData);
  }

  setProfileImage(userId: number, imageId: number): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/${userId}/profile-image/${imageId}`, {});
  }

  getAvatarsByCategory(category: string): Observable<number[]> {
    return this.http.get<number[]>(`/api/images/avatars/${category}`);
  }

  getImagesByType(type: string): Observable<number[]> {
    return this.http.get<number[]>(`/api/images/type/${type}`);
  }
}
