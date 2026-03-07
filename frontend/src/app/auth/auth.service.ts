import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { FamilyAuthResponseDto, LoginRequest, RegisterRequest } from './token.model';

/**
 * Service responsible for authentication flows and token management.
 *
 * - Stores access tokens in `localStorage`.
 * - Exposes a reactive `isAuthenticated$` observable for UI components.
 * - Provides `login`, `register`, and `logout` operations used by the app.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Base URL for family-related auth endpoints. */
  private apiBase = 'http://localhost:8080/api/families';

  /** Key used to store the access token in localStorage. */
  private accessTokenKey = 'auth.accessToken';
  private persistFlagKey = 'auth.persist';

  /** Internal signal tracking whether an access token is present. */
  private _isAuthenticated = signal<boolean>(!!this.getAccessToken());

  /**
   * Public observable that emits the current authentication state.
   * Components can subscribe to this to react to login/logout changes.
   */
  public isAuthenticated$ = new BehaviorSubject<boolean>(this._isAuthenticated());

  /**
  * a way to store the familyEmail and a public observable to use it in other pages
  */
  private familyEmailSubject = new BehaviorSubject<string | null>(null);
  public familyEmail$ = this.familyEmailSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  /**
   * Read the current access token from localStorage.
   * @returns The stored access token, or `null` if none exists.
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey) ?? sessionStorage.getItem(this.accessTokenKey);
  }

  /**
   * Persist or remove the access token and update auth state.
   * @param token The access token to store, or `null` to clear it.
   * @private
   */
  private setAccessToken(token: string | null, remember = true) {
    if (token) {
      if (remember) {
        localStorage.setItem(this.accessTokenKey, token);
        localStorage.setItem(this.persistFlagKey, '1');
        sessionStorage.removeItem(this.accessTokenKey);
      } else {
        sessionStorage.setItem(this.accessTokenKey, token);
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.persistFlagKey);
      }
    } else {
      localStorage.removeItem(this.accessTokenKey);
      sessionStorage.removeItem(this.accessTokenKey);
      localStorage.removeItem(this.persistFlagKey);
    }

    this._isAuthenticated.set(!!token);
    this.isAuthenticated$.next(this._isAuthenticated());
  }

  /**
   * Perform a login request against the backend.
   * On success the returned access token is saved to localStorage.
   *
   * @param payload Credentials for login (email + password).
   * @returns An observable that emits the backend auth response.
   */
  login(payload: LoginRequest, remember = true): Observable<FamilyAuthResponseDto> {
    return this.http.post<FamilyAuthResponseDto>(`${this.apiBase}/login`, payload, { withCredentials: true }).pipe(
      switchMap((res) => {
        this.setAccessToken(res.accessToken, remember);
        this.familyEmailSubject.next(res.familyEmail); // Store family email from response
        return of(res);
      })
    );
  }

  /**
   * Request a new access token using the HttpOnly refresh token cookie.
   * The backend rotates the refresh token and returns a new access token in
   * the response body. The request must be sent with credentials so the
   * browser includes the HttpOnly cookie.
   */
  refresh(): Observable<FamilyAuthResponseDto> {
    const remember = !!localStorage.getItem(this.persistFlagKey);
    return this.http.post<FamilyAuthResponseDto>(`${this.apiBase}/refresh`, {}, { withCredentials: true }).pipe(
      switchMap((res) => {
        this.setAccessToken(res.accessToken, remember);
        return of(res);
      })
    );
  }

  /**
   * Register a new family account.
   * @param payload Registration details.
   * @returns An observable that completes when registration is done.
   */
  register(payload: RegisterRequest): Observable<void> {
    return this.http.post<void>(`${this.apiBase}/register`, payload);
  }

  /**
   * Clear authentication state locally and redirect to the login page.
   * Called on explicit logout or when token refresh fails after expiry.
   */
  logout() {
    this.setAccessToken(null);
    this.familyEmailSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Update the stored access token after a refresh operation.
   * Called by an HTTP interceptor when a refreshed token is received.
   * @param token The new access token string.
   */
  setAccessTokenFromRefresh(token: string) {
    const remember = !!localStorage.getItem(this.persistFlagKey);
    this.setAccessToken(token, remember);
  }

  /**
   * Synchronously determine whether the user is currently authenticated.
   * Useful for immediate checks (e.g. during component construction) where
   * subscribing to the reactive `isAuthenticated$` stream is unnecessary.
   * @returns `true` when an access token is present, otherwise `false`.
   */
  isAuthenticated(): boolean {
    return this._isAuthenticated();
  }

  getFamilyEmail(): string | null {
    return this.familyEmailSubject.value;
  }


}

