import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { UserService, User } from '../../services/user.service';
import { MemberService } from '../../services/member/member-service';
import { PointsStore } from '../../services/points-store.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  const mockUser: User = {
    id: 1,
    name: 'Anders',
    email: 'anders@test.com',
    role: 'PARENT',
    totalPoints: 50,
    imageId: 1,
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
      imageId: 2,
      family: { email: 'test@family.com' },
      familyEmail: 'test@family.com',
    },
  ];

  let userService: any;
  let memberService: any;
  let pointsStore: any;

  beforeEach(async () => {
    const currentUserSignal = signal<User | null>(mockUser);
    const membersSignal = signal<User[]>(mockMembers);

    userService = {
      currentUser: currentUserSignal,
      getUsersByFamilyEmail: vi.fn().mockReturnValue(of(mockMembers)),
      getImageUrl: vi.fn((id: number) => (id ? `/api/images/${id}` : 'assets/default-avatar.png')),
      logoutUser: vi.fn(),
    };

    memberService = {
      members: membersSignal,
      setMembers: vi.fn(),
    };

    pointsStore = {
      loadUser: vi.fn(),
      setTotalPoints: vi.fn(),
      totalPoints: signal(0),
      targetPoints: signal(100),
      safeTarget: signal(100),
      currentLevelPoints: signal(0),
      progress: signal(0),
      totalRewards: signal(0),
      addPoints: vi.fn(),
      setTargetPoints: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: userService },
        { provide: MemberService, useValue: memberService },
        { provide: PointsStore, useValue: pointsStore },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('displays current user name', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.current-user-name')?.textContent).toContain('Anders');
  });

  it('loads family members on init', () => {
    expect(userService.getUsersByFamilyEmail).toHaveBeenCalledWith('test@family.com');
    expect(memberService.setMembers).toHaveBeenCalledWith(mockMembers);
  });

  it('loads points store for current user on init', () => {
    expect(pointsStore.loadUser).toHaveBeenCalledWith(1);
  });

  it('renders all family members', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const members = compiled.querySelectorAll('.member-item');
    expect(members.length).toBe(2);
  });

  it('shows admin link for parent users', () => {
    expect(component.isParent).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    const adminLink = compiled.querySelector('a[routerLink="/admin"]');
    expect(adminLink).toBeTruthy();
  });

  it('hides admin link for child users', () => {
    const childSignal = signal<User | null>({ ...mockUser, role: 'CHILD' });
    userService.currentUser = childSignal;

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isParent).toBe(false);
  });

  it('calls logoutUser on logout click', () => {
    component.onLogout();
    expect(userService.logoutUser).toHaveBeenCalled();
  });

  it('delegates getImageUrl to UserService', () => {
    const result = component.getImageUrl(5);
    expect(userService.getImageUrl).toHaveBeenCalledWith(5);
    expect(result).toBe('/api/images/5');
  });

  it('shows add member button for parent', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const addBtn = compiled.querySelector('.add-member-btn');
    expect(addBtn).toBeTruthy();
  });

  it('shows empty message when no members', () => {
    const emptyMembersSignal = signal<User[]>([]);
    memberService.members = emptyMembersSignal;

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-msg')?.textContent).toContain(
      'Ingen familiemedlemmer fundet',
    );
  });
});
