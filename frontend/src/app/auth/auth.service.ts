import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  catchError,
  firstValueFrom,
  of,
  shareReplay,
  switchMap,
  tap,
  finalize,
  map,
} from 'rxjs';
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
  private http = inject(HttpClient);
  private router = inject(Router);

  /** Base URL for family-related auth endpoints. */
  private apiBase = '/api/families';

  /** Key used to store the access token in localStorage. */
  private accessTokenKey = 'auth.accessToken';
  private familyEmailKey = 'auth.familyEmail';
  private persistFlagKey = 'auth.persist';
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly refreshSkewMs = 30_000;
  private refreshInFlight$: Observable<FamilyAuthResponseDto> | null = null;

  /** Internal signal tracking whether a valid access token is present. */
  private _isAuthenticated = signal<boolean>(false);

  /**
   * Public observable that emits the current authentication state.
   * Components can subscribe to this to react to login/logout changes.
   */
  public isAuthenticated$ = new BehaviorSubject<boolean>(this._isAuthenticated());

  /**
   * a way to store the familyEmail and a public observable to use it in other pages
   */
  private familyEmailSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('auth.familyEmail'),
  );
  public familyEmail$ = this.familyEmailSubject.asObservable();

  constructor() {
    this.syncAuthStateFromStorage();
  }

  private getStoredAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey) ?? sessionStorage.getItem(this.accessTokenKey);
  }

  private decodeTokenPayload(token: string): Record<string, unknown> | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;

      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }

  private getTokenExpirationMs(token: string): number | null {
    const payload = this.decodeTokenPayload(token);
    const exp = payload?.['exp'];
    if (typeof exp !== 'number') return null;
    return exp * 1000;
  }

  private isTokenExpired(token: string): boolean {
    const expiry = this.getTokenExpirationMs(token);
    if (!expiry) return false;
    return Date.now() >= expiry;
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private scheduleSilentRefresh(token: string | null): void {
    this.clearRefreshTimer();
    if (!token) return;

    const expiry = this.getTokenExpirationMs(token);
    if (!expiry) return;

    const delay = expiry - Date.now() - this.refreshSkewMs;
    if (delay <= 0) {
      this.refresh()
        .pipe(
          catchError(() => {
            this.logout();
            return of(null);
          }),
        )
        .subscribe();
      return;
    }

    this.refreshTimer = setTimeout(() => {
      this.refresh()
        .pipe(
          catchError(() => {
            this.logout();
            return of(null);
          }),
        )
        .subscribe();
    }, delay);
  }

  private syncAuthStateFromStorage(): void {
    const token = this.getStoredAccessToken();
    if (!token) {
      this._isAuthenticated.set(false);
      this.isAuthenticated$.next(false);
      this.clearRefreshTimer();
      return;
    }

    if (this.isTokenExpired(token)) {
      this.setAccessToken(null);
      return;
    }

    this._isAuthenticated.set(true);
    this.isAuthenticated$.next(true);
    this.scheduleSilentRefresh(token);
  }

  /**
   * Read the current access token from localStorage.
   * @returns The stored access token, or `null` if none exists.
   */
  getAccessToken(): string | null {
    const token = this.getStoredAccessToken();
    if (!token) return null;

    if (this.isTokenExpired(token)) {
      this.setAccessToken(null);
      return null;
    }

    return token;
  }

  /**
   * Persist or remove the access token and update auth state.
   * @param token The access token to store, or `null` to clear it.
   * @private
   */
  private setAccessToken(token: string | null, remember = true) {
    const validToken = token && !this.isTokenExpired(token) ? token : null;

    if (validToken) {
      if (remember) {
        localStorage.setItem(this.accessTokenKey, validToken);
        localStorage.setItem(this.persistFlagKey, '1');
        sessionStorage.removeItem(this.accessTokenKey);
      } else {
        sessionStorage.setItem(this.accessTokenKey, validToken);
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.persistFlagKey);
      }
    } else {
      localStorage.removeItem(this.accessTokenKey);
      sessionStorage.removeItem(this.accessTokenKey);
      localStorage.removeItem(this.persistFlagKey);
      localStorage.removeItem(this.familyEmailKey);
    }

    this._isAuthenticated.set(!!validToken);
    this.isAuthenticated$.next(this._isAuthenticated());
    this.scheduleSilentRefresh(validToken);
  }

  /**
   * Bootstraps auth state on app startup.
   * If no valid access token is present, attempts hidden refresh using the
   * HttpOnly refresh-token cookie.
   */
  async initializeSession(): Promise<void> {
    const token = this.getStoredAccessToken();
    if (token && !this.isTokenExpired(token)) {
      this.setAccessToken(token, !!localStorage.getItem(this.persistFlagKey));
      return;
    }

    if (token && this.isTokenExpired(token)) {
      this.setAccessToken(null);
    }

    await firstValueFrom(
      this.refresh().pipe(
        map(() => void 0),
        catchError(() => {
          this.setAccessToken(null);
          return of(void 0);
        }),
      ),
    );
  }

  /**
   * Perform a login request against the backend.
   * On success the returned access token is saved to localStorage.
   *
   * @param payload Credentials for login (email + password).
   * @returns An observable that emits the backend auth response.
   */
  login(payload: LoginRequest, remember = true): Observable<FamilyAuthResponseDto> {
    return this.http
      .post<FamilyAuthResponseDto>(`${this.apiBase}/login`, payload, { withCredentials: true })
      .pipe(
        switchMap((res) => {
          this.setAccessToken(res.accessToken, remember);
          localStorage.setItem(this.familyEmailKey, res.familyEmail); // Store family email
          this.familyEmailSubject.next(res.familyEmail); // Notify subscribers
          return of(res);
        }),
      );
  }

  /**
   * Request a new access token using the HttpOnly refresh token cookie.
   * The backend rotates the refresh token and returns a new access token in
   * the response body. The request must be sent with credentials so the
   * browser includes the HttpOnly cookie.
   */
  refresh(): Observable<FamilyAuthResponseDto> {
    if (this.refreshInFlight$) return this.refreshInFlight$;

    const remember = !!localStorage.getItem(this.persistFlagKey);
    this.refreshInFlight$ = this.http
      .post<FamilyAuthResponseDto>(`${this.apiBase}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((res) => {
          console.log('[AuthService] Refresh API success, updating email subject');
          this.setAccessToken(res.accessToken, remember);

          localStorage.setItem(this.familyEmailKey, res.familyEmail); // Update stored email
          this.familyEmailSubject.next(res.familyEmail);
        }),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        shareReplay(1),
      );

    return this.refreshInFlight$;
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
