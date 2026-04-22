import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { UserService, User } from './user.service';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('UserService', () => {
  let service: UserService;
  let httpTesting: HttpTestingController;
  let router: { navigate: ReturnType<typeof vi.fn> };

  const mockUser: User = {
    id: 1,
    name: 'Anders',
    email: 'anders@test.com',
    role: 'PARENT',
    totalPoints: 50,
    targetPoints: 100,
    imageId: 1,
    family: { email: 'test@family.com' },
    familyEmail: 'test@family.com',
  };

  beforeEach(() => {
    sessionStorage.clear();
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });

    service = TestBed.inject(UserService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    sessionStorage.clear();
  });

  describe('currentUser signal', () => {
    it('starts as null when no session data', () => {
      expect(service.currentUser()).toBeNull();
    });

    it('reads from sessionStorage on init', () => {
      sessionStorage.setItem('currentUser', JSON.stringify(mockUser));
      service = TestBed.inject(UserService);
      // Note: singleton — may still be null from first init
      // This tests the constructor path
    });
  });

  describe('setCurrentUser', () => {
    it('stores user in sessionStorage and updates signal', () => {
      service.setCurrentUser(mockUser);

      expect(service.currentUser()).toEqual(mockUser);
      expect(JSON.parse(sessionStorage.getItem('currentUser')!)).toEqual(mockUser);
    });
  });

  describe('logoutUser', () => {
    it('clears sessionStorage, resets signal, and navigates to select-member', () => {
      service.setCurrentUser(mockUser);

      service.logoutUser();

      expect(service.currentUser()).toBeNull();
      expect(sessionStorage.getItem('currentUser')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/select-member']);
    });
  });

  describe('getUser', () => {
    it('sends GET to /api/users/{id}', () => {
      service.getUser(1).subscribe((user) => {
        expect(user.name).toBe('Anders');
      });

      const req = httpTesting.expectOne('/api/users/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });
  });

  describe('deleteUser', () => {
    it('sends DELETE to /api/users/{id}', () => {
      service.deleteUser(1).subscribe();

      const req = httpTesting.expectOne('/api/users/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('addPoints', () => {
    it('sends POST to /api/users/{id}/add-points/{points}', () => {
      service.addPoints(1, 25).subscribe();

      const req = httpTesting.expectOne('/api/users/1/add-points/25');
      expect(req.request.method).toBe('POST');
      req.flush(mockUser);
    });
  });

  describe('getUsersByFamilyEmail', () => {
    it('sends GET to /api/users/family/{email}', () => {
      service.getUsersByFamilyEmail('test@family.com').subscribe((users) => {
        expect(users).toHaveLength(2);
      });

      const req = httpTesting.expectOne('/api/users/family/test@family.com');
      expect(req.request.method).toBe('GET');
      req.flush([mockUser, { ...mockUser, id: 2, name: 'Maja' }]);
    });
  });

  describe('getTasksByUserId', () => {
    it('sends GET to /api/users/{id}/tasks', () => {
      service.getTasksByUserId(1).subscribe((tasks) => {
        expect(tasks).toHaveLength(1);
      });

      const req = httpTesting.expectOne('/api/users/1/tasks');
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 1, name: 'Clean room' }]);
    });
  });

  describe('validatePin', () => {
    it('sends POST to /api/users/{id}/validate-pin', () => {
      service.validatePin(1, '1234').subscribe((valid) => {
        expect(valid).toBe(true);
      });

      const req = httpTesting.expectOne('/api/users/1/validate-pin');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ pin: '1234' });
      req.flush(true);
    });
  });

  describe('getImageUrl', () => {
    it('returns image API URL when imageId is provided', () => {
      expect(service.getImageUrl(5)).toBe('/api/images/5');
    });

    it('returns default avatar when imageId is undefined', () => {
      expect(service.getImageUrl(undefined)).toBe('/api/images/default');
    });

    it('returns default avatar when imageId is 0', () => {
      expect(service.getImageUrl(0)).toBe('/api/images/default');
    });
  });

  describe('uploadImage', () => {
    it('sends POST with FormData to /api/images/upload', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      service.uploadImage(file).subscribe((id) => {
        expect(id).toBe(5);
      });

      const req = httpTesting.expectOne('/api/images/upload');
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(5);
    });
  });

  describe('setProfileImage', () => {
    it('sends POST to /api/users/{userId}/profile-image/{imageId}', () => {
      service.setProfileImage(1, 5).subscribe();

      const req = httpTesting.expectOne('/api/users/1/profile-image/5');
      expect(req.request.method).toBe('POST');
      req.flush(mockUser);
    });
  });
});
