import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, from, throwError, switchMap, catchError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private refreshing = false;

  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip adding auth header for login/register/refresh endpoints
    if (req.url.endsWith('/login') || req.url.endsWith('/register') || req.url.endsWith('/refresh')) {
      return next.handle(req);
    }

    const token = this.auth.getAccessToken();
    let authReq = req;
    if (token) {
      authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // try to refresh by calling the refresh endpoint
          if (this.refreshing) {
            // if a refresh is already in progress, just fail the request
            return throwError(() => error);
          }

          this.refreshing = true;
          // call the refresh endpoint which uses an HttpOnly cookie
          return this.auth
            .refresh()
            .pipe(
              switchMap((res) => {
                this.refreshing = false;
                if (res?.accessToken) {
                  this.auth.setAccessTokenFromRefresh(res.accessToken);
                  const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${res.accessToken}` } });
                  return next.handle(retryReq);
                }
                return throwError(() => error);
              }),
              catchError((refreshErr) => {
                this.refreshing = false;
                this.auth.logout();
                return throwError(() => refreshErr);
              })
            );
        }
        return throwError(() => error);
      })
    );
  }
}

