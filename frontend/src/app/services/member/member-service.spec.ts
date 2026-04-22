import { TestBed } from '@angular/core/testing';
import { MemberService } from './member-service';
import { UserService, User } from '../user.service';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('MemberService', () => {
  let service: MemberService;
  let userService: any;

  const mockUser: User = {
    id: 1,
    name: 'Anders',
    email: 'anders@test.com',
    role: 'PARENT',
    totalPoints: 50,
    targetPoints: 100,
    family: { email: 'test@family.com' },
    familyEmail: 'test@family.com',
  };

  const mockMembers: User[] = [
    mockUser,
    {
      id: 2,
      name: 'Maja',
      email: 'maja@test.com',
      role: 'CHILD',
      totalPoints: 30,
      targetPoints: 100,
      family: { email: 'test@family.com' },
    },
  ];

  beforeEach(() => {
    userService = {
      currentUser: signal<User | null>(mockUser),
      getUsersByFamilyEmail: vi.fn().mockReturnValue(of(mockMembers)),
    };

    TestBed.configureTestingModule({
      providers: [MemberService, { provide: UserService, useValue: userService }],
    });

    service = TestBed.inject(MemberService);
  });

  describe('members signal', () => {
    it('starts with empty array', () => {
      expect(service.members()).toEqual([]);
    });
  });

  describe('setMembers', () => {
    it('updates the members signal', () => {
      service.setMembers(mockMembers);

      expect(service.members()).toHaveLength(2);
      expect(service.members()[0].name).toBe('Anders');
      expect(service.members()[1].name).toBe('Maja');
    });
  });

  describe('addMember', () => {
    it('appends a member to the existing list', () => {
      service.setMembers([mockUser]);

      const newMember: User = {
        id: 3,
        name: 'Svend',
        email: 'svend@test.com',
        role: 'CHILD',
        totalPoints: 0,
        targetPoints: 100,
        family: { email: 'test@family.com' },
      };

      service.addMember(newMember);

      expect(service.members()).toHaveLength(2);
      expect(service.members()[1].name).toBe('Svend');
    });
  });

  describe('loadMembers', () => {
    it('fetches members by current user email and sets them', () => {
      service.loadMembers();

      expect(userService.getUsersByFamilyEmail).toHaveBeenCalledWith('anders@test.com');
      expect(service.members()).toHaveLength(2);
    });

    it('does nothing when no current user', () => {
      userService.currentUser = signal<User | null>(null);

      //with null user
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [MemberService, { provide: UserService, useValue: userService }],
      });
      service = TestBed.inject(MemberService);

      service.loadMembers();

      expect(userService.getUsersByFamilyEmail).not.toHaveBeenCalled();
      expect(service.members()).toEqual([]);
    });

    it('handles API errors gracefully', () => {
      userService.getUsersByFamilyEmail.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      service.loadMembers();

      expect(service.members()).toEqual([]);
    });
  });
});
