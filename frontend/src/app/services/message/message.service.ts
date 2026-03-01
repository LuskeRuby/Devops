import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MessageResponse {
  id: number;
  content: string;
  timestamp: string;
  username: string;
  userId: number;
}

@Injectable({
  providedIn: 'root',
})
export class MessageService {

  private apiUrl = 'http://localhost:8080/api/messages';

  constructor(private http: HttpClient) {}

  getMessages(): Observable<MessageResponse[]> {
    return this.http.get<MessageResponse[]>(this.apiUrl);
  }
}
