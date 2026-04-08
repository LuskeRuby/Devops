import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { CalendarComponent } from './calendar';

import { CalendarEventService } from '../../services/calendar-event.service';
import { UserService } from '../../services/user.service';
import { PointsStore } from '../../services/points-store.service';
import { MatDialog } from '@angular/material/dialog';

describe('CalendarComponent', () => {
  let component: CalendarComponent;
  let fixture: ComponentFixture<CalendarComponent>;

  let calendarEventService: any;
  let userService: any;
  let pointsStore: any;
  let dialog: any;

  const mockUser = {
    id: 1,
    role: 'PARENT',
    familyEmail: 'test@family.com'
  };

  beforeEach(async () => {
    calendarEventService = {
      loadFamilyEvents: vi.fn().mockReturnValue(of([])),
      loadUserEvents: vi.fn().mockReturnValue(of([])),
      createEvent: vi.fn().mockReturnValue(of({})),
      updateEvent: vi.fn().mockReturnValue(of({}))
    };

    userService = {
      currentUser: vi.fn().mockReturnValue(mockUser),
      getUsersByFamilyEmail: vi.fn().mockReturnValue(of([]))
    };

    pointsStore = {
      loadUser: vi.fn()
    };

    dialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(undefined)
      })
    };

    await TestBed.configureTestingModule({
      imports: [CalendarComponent],
      providers: [
        { provide: CalendarEventService, useValue: calendarEventService },
        { provide: UserService, useValue: userService },
        { provide: PointsStore, useValue: pointsStore },
        { provide: MatDialog, useValue: dialog }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
  });

  // ---------------- BASICS ----------------

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should detect parent role', () => {
    component.currentUser = mockUser as any;
    expect(component.isParent).toBe(true);
  });

  // ---------------- VIEW ----------------

  it('should toggle view and emit event', () => {
    const spy = vi.spyOn(component.viewChange, 'emit');

    component.isDayView = false;
    component.toggleView();

    expect(component.isDayView).toBe(true);
    expect(spy).toHaveBeenCalledWith(true);
  });

  // ---------------- LOAD EVENTS ----------------

  it('should load family events for parent', () => {
    component.currentUser = mockUser as any;

    component.loadEvents();

    expect(calendarEventService.loadFamilyEvents).toHaveBeenCalledWith(
      'test@family.com',
      1
    );
  });

  it('should set error if no family email', () => {
    userService.currentUser.mockReturnValue({ id: 1, role: 'PARENT' });

    component.loadEvents();

    expect(component.loadError).toBe('Missing family');
    expect(component.events).toEqual([]);
  });

  it('should handle load error', () => {
    calendarEventService.loadFamilyEvents.mockReturnValue(
      throwError(() => new Error('fail'))
    );

    component.currentUser = mockUser as any;

    component.loadEvents();

    expect(component.loadError).toBe('Failed to load events');
    expect(component.events).toEqual([]);
  });

  // ---------------- DIALOG SAVE ----------------

  it('should call createEvent on save', () => {
    component.currentUser = mockUser as any;

    component.handleDialog({
      mode: 'create',
      title: 'Test',
      description: '',
      start: new Date(),
      end: new Date(),
      userIds: [],
      isSeparateTasks: false,
      points: 0
    } as any);

    expect(calendarEventService.createEvent).toHaveBeenCalled();
  });

  it('should call updateEvent on update', () => {
    component.currentUser = mockUser as any;

    component.handleDialog({
      mode: 'update',
      eventId: 1,
      title: 'Test',
      description: '',
      start: new Date(),
      end: new Date(),
      userIds: [],
      isSeparateTasks: false,
      points: 0
    } as any);

    expect(calendarEventService.updateEvent).toHaveBeenCalled();
  });
});
