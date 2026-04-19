import { Injectable, inject } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, switchMap, catchError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private auth = inject(AuthService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (
      req.url.endsWith('/login') ||
      req.url.endsWith('/register') ||
      req.url.endsWith('/refresh')
    ) {
      return next.handle(req);
    }

    const token = this.auth.getAccessToken();
    const hadAccessToken = !!token;
    let authReq = req;
    if (token) {
      authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Try hidden refresh using HttpOnly cookie on any protected 401.
          return this.auth.refresh().pipe(
            switchMap((res) => {
              if (res?.accessToken) {
                this.auth.setAccessTokenFromRefresh(res.accessToken);
                const retryReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${res.accessToken}` },
                });
                return next.handle(retryReq);
              }
              return throwError(() => error);
            }),
            catchError((refreshErr) => {
              if (hadAccessToken) {
                this.auth.logout();
              }
              return throwError(() => refreshErr);
            }),
          );
        }
        return throwError(() => error);
      }),
    );
  }
}
