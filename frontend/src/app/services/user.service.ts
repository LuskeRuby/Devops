import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

 getUsersByFamilyEmail(familyEmail: string): Observable<User[]> {
   return this.http.get<User[]>(`${this.apiUrl}/family/${familyEmail}`);
 }
}
