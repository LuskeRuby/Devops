import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MessageResponse {
  id: number;
  content: string;
  timestamp: string;
  username: string;
  userId: number;
  imageId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private http = inject(HttpClient);

  private apiUrl = '/api/messages';

  getMessages(familyEmail: string): Observable<MessageResponse[]> {
    return this.http.get<MessageResponse[]>(`${this.apiUrl}?familyEmail=${familyEmail}`);
  }
}
