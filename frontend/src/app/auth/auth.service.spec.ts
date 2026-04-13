import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { FamilyAuthResponseDto } from './token.model';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

function fakeJwt(expiresInMs: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256' }));
  const payload = btoa(
    JSON.stringify({ sub: 'test@family.com', exp: Math.floor((Date.now() + expiresInMs) / 1000) }),
  );
  return `${header}.${payload}.fake-signature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('stores token and familyEmail on login', () => {
    const mockRes: FamilyAuthResponseDto = {
      accessToken: fakeJwt(60_000),
      familyEmail: 'test@family.com',
    };

    service.login({ email: 'test@family.com', password: 'pass' }).subscribe((res) => {
      expect(res.familyEmail).toBe('test@family.com');
      expect(service.isAuthenticated()).toBe(true);
      expect(service.getFamilyEmail()).toBe('test@family.com');
      expect(localStorage.getItem('auth.familyEmail')).toBe('test@family.com');
    });

    const req = httpTesting.expectOne('/api/families/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush(mockRes);
  });

  it('sends POST to register endpoint', () => {
    service.register({ email: 'new@family.com', password: 'securepass' }).subscribe();

    const req = httpTesting.expectOne('/api/families/register');
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('clears everything on logout', () => {
    localStorage.setItem('auth.accessToken', fakeJwt(60_000));
    localStorage.setItem('auth.familyEmail', 'test@family.com');

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.getAccessToken()).toBeNull();
    expect(service.getFamilyEmail()).toBeNull();
    expect(localStorage.getItem('auth.familyEmail')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('returns null when no token stored', () => {
    expect(service.getAccessToken()).toBeNull();
  });

  it('returns null and clears expired token', () => {
    localStorage.setItem('auth.accessToken', fakeJwt(-1000));
    service = TestBed.inject(AuthService);
    expect(service.getAccessToken()).toBeNull();
  });

  it('sends credentialed POST on refresh', () => {
    service.refresh().subscribe();

    const req = httpTesting.expectOne('/api/families/refresh');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ accessToken: fakeJwt(60_000), familyEmail: 'test@family.com' });
  });

  it('deduplicates concurrent refresh calls', () => {
    service.refresh().subscribe();
    service.refresh().subscribe();

    const requests = httpTesting.match('/api/families/refresh');
    expect(requests.length).toBe(1);
    requests[0].flush({ accessToken: fakeJwt(60_000), familyEmail: 'test@family.com' });
  });

  it('updates token via setAccessTokenFromRefresh', () => {
    const token = fakeJwt(60_000);
    service.setAccessTokenFromRefresh(token);

    expect(service.getAccessToken()).toBe(token);
    expect(service.isAuthenticated()).toBe(true);
  });
});
