import { Injectable } from '@angular/core';
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

  private apiUrl = '/api/messages';

  constructor(private http: HttpClient) { }

  getMessages(familyEmail: string): Observable<MessageResponse[]> {
    return this.http.get<MessageResponse[]>(`${this.apiUrl}?familyEmail=${familyEmail}`);
  }
}
