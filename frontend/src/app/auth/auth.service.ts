import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { FamilyAuthResponseDto, LoginRequest, RegisterRequest } from './token.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiBase = 'http://localhost:8080/api/families';

  private accessTokenKey = 'auth.accessToken';
  private _isAuthenticated = signal<boolean>(!!this.getAccessToken());

  // expose a readonly observable for components that prefer it
  public isAuthenticated$ = new BehaviorSubject<boolean>(this._isAuthenticated());

  constructor(private http: HttpClient) {}

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  private setAccessToken(token: string | null) {
    if (token) {
      localStorage.setItem(this.accessTokenKey, token);
    } else {
      localStorage.removeItem(this.accessTokenKey);
    }
    this._isAuthenticated.set(!!token);
    this.isAuthenticated$.next(this._isAuthenticated());
  }

  login(payload: LoginRequest): Observable<FamilyAuthResponseDto> {
    return this.http.post<FamilyAuthResponseDto>(`${this.apiBase}/login`, payload).pipe(
      switchMap((res) => {
        this.setAccessToken(res.accessToken);
        return of(res);
      })
    );
  }

  register(payload: RegisterRequest): Observable<void> {
    return this.http.post<void>(`${this.apiBase}/register`, payload);
  }

  logout() {
    this.setAccessToken(null);
    // The backend issues refresh token in HttpOnly cookie; if the backend also
    // has a logout endpoint, call it here.
  }

  // Used by the interceptor to update an access token after refresh
  setAccessTokenFromRefresh(token: string) {
    this.setAccessToken(token);
  }
}

