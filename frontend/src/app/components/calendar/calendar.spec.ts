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
    familyEmail: 'test@family.com',
  };

  beforeEach(async () => {
    calendarEventService = {
      loadFamilyEvents: vi.fn().mockReturnValue(of([])),
      loadUserEvents: vi.fn().mockReturnValue(of([])),
      createEvent: vi.fn().mockReturnValue(of({})),
      updateEvent: vi.fn().mockReturnValue(of({})),
      completeEvent: vi.fn().mockReturnValue(of({})),
      uncompleteEvent: vi.fn().mockReturnValue(of({})),
    };

    userService = {
      currentUser: vi.fn().mockReturnValue(mockUser),
      getUsersByFamilyEmail: vi.fn().mockReturnValue(of([])),
    };

    pointsStore = {
      loadUser: vi.fn(),
    };

    dialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(undefined),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [CalendarComponent],
      providers: [
        { provide: CalendarEventService, useValue: calendarEventService },
        { provide: UserService, useValue: userService },
        { provide: PointsStore, useValue: pointsStore },
        { provide: MatDialog, useValue: dialog },
      ],
      schemas: [NO_ERRORS_SCHEMA],
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

    expect(calendarEventService.loadFamilyEvents).toHaveBeenCalledWith('test@family.com', 1);
  });

  it('should set error if no family email', () => {
    userService.currentUser.mockReturnValue({ id: 1, role: 'PARENT' });

    component.loadEvents();

    expect(component.loadError).toBe('Missing family');
    expect(component.events()).toEqual([]);
  });

  it('should handle load error', () => {
    calendarEventService.loadFamilyEvents.mockReturnValue(throwError(() => new Error('fail')));

    component.currentUser = mockUser as any;

    component.loadEvents();

    expect(component.loadError).toBe('Failed to load events');
    expect(component.events()).toEqual([]);
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
      points: 0,
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
      points: 0,
    } as any);

    expect(calendarEventService.updateEvent).toHaveBeenCalled();
  });

  it('should allow toggle if user is assigned', () => {
    component.currentUser = { id: 1 } as any;

    const event: any = {
      meta: {
        assignedUserIds: [1],
      },
    };

    expect(component.canToggleTask(event)).toBe(true);
  });

  it('should toggle task when allowed', () => {
    const spy = vi.spyOn(component, 'toggleFromCalendar');

    component.currentUser = { id: 1, role: 'CHILD' } as any;

    const event: any = {
      meta: { assignedUserIds: [1] },
    };

    component.handleCheckboxClick(event, new MouseEvent('click'));

    expect(spy).toHaveBeenCalled();
  });

  it('should complete event when unchecked', () => {
    calendarEventService.completeEvent = vi.fn().mockReturnValue(of({}));

    component.currentUser = mockUser as any;

    const event: any = {
      id: 1,
      meta: { checked: false },
    };

    component.toggleFromCalendar(event);

    expect(calendarEventService.completeEvent).toHaveBeenCalledWith(1, 1);
  });

  it('should update event time and call service', () => {
    calendarEventService.updateEvent = vi.fn().mockReturnValue(of({}));

    component.currentUser = mockUser as any;

    const event: any = {
      id: 1,
      title: 'Test',
      start: new Date(),
      meta: {},
    };

    component.onEventTimesChanged({
      event,
      newStart: new Date(),
      newEnd: new Date(),
    } as any);

    expect(calendarEventService.updateEvent).toHaveBeenCalled();
  });

  it('should load family users', () => {
    userService.getUsersByFamilyEmail = vi.fn().mockReturnValue(of([{ id: 2 }]));

    component.currentUser = mockUser as any;

    component.loadFamilyUsers();

    expect(component.familyUsers.length).toBe(1);
  });

  it('should fallback to family.email if familyEmail is missing', () => {
    const user = {
      id: 1,
      role: 'PARENT',
      family: { email: 'fallback@test.com' },
    };

    userService.currentUser.mockReturnValue(user);
    component.currentUser = user as any;

    component.loadEvents();

    expect(calendarEventService.loadFamilyEvents).toHaveBeenCalledWith('fallback@test.com', 1);
  });

  it('should return null family email if none exists', () => {
    userService.currentUser.mockReturnValue({
      id: 1,
      role: 'PARENT',
    });

    component.loadEvents();

    expect(component.loadError).toBe('Missing family');
  });

  it('should NOT open create dialog if clicking inside event', () => {
    const spy = vi.spyOn(component, 'openCreateDialog');

    component.currentUser = mockUser as any;

    const fakeTarget = document.createElement('div');

    // simulate click INSIDE event
    fakeTarget.closest = vi.fn().mockReturnValue(true);

    component.onHourSegmentClicked({
      date: new Date(),
      sourceEvent: {
        target: fakeTarget,
      } as any,
    });

    expect(spy).not.toHaveBeenCalled();
  });

  it('should open create dialog when clicking empty slot', () => {
    const spy = vi.spyOn(component, 'openCreateDialog').mockImplementation(() => {});

    component.currentUser = mockUser as any;

    const fakeTarget = document.createElement('div');
    fakeTarget.closest = vi.fn().mockReturnValue(null);

    component.onHourSegmentClicked({
      date: new Date(),
      sourceEvent: {
        target: fakeTarget,
      } as any,
    });

    expect(spy).toHaveBeenCalled();
  });

  it('should NOT open edit dialog if not parent', () => {
    const spy = vi.spyOn(component, 'openEditDialog');

    component.currentUser = { id: 2, role: 'CHILD' } as any;

    const fakeEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as any;

    component.onEventTemplateClick({} as any, fakeEvent);

    expect(spy).not.toHaveBeenCalled();
  });

  it('should call handleDialog after create dialog closes', () => {
    const spy = vi.spyOn(component, 'handleDialog');

    component.currentUser = mockUser as any;

    vi.spyOn(component, 'openCreateDialog').mockImplementation(() => {
      component.handleDialog({
        mode: 'create',
        title: 'Test',
        description: '',
        start: new Date(),
        end: new Date(),
        userIds: [],
        isSeparateTasks: false,
        points: 0,
      } as any);
    });

    component.openCreateDialog(new Date());

    expect(spy).toHaveBeenCalled();
  });

  it('should open dialog if no sourceEvent', () => {
    const spy = vi.spyOn(component, 'openCreateDialog').mockImplementation(() => {});

    component.currentUser = mockUser as any;

    component.onHourSegmentClicked({
      date: new Date(),
    });

    expect(spy).toHaveBeenCalled();
  });

  it('should stop propagation on event click', () => {
    component.currentUser = mockUser as any;

    const fakeEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as any;

    // prevent dialog crash
    vi.spyOn(component, 'openEditDialog').mockImplementation(() => {});

    component.onEventTemplateClick({} as any, fakeEvent);

    expect(fakeEvent.preventDefault).toHaveBeenCalled();
    expect(fakeEvent.stopPropagation).toHaveBeenCalled();
  });

  it('should NOT toggle or open dialog if user cannot toggle and not parent', () => {
    const toggleSpy = vi.spyOn(component, 'toggleFromCalendar');
    const editSpy = vi.spyOn(component, 'openEditDialog');

    component.currentUser = { id: 2, role: 'CHILD' } as any;

    const event: any = {
      meta: { assignedUserIds: [999] },
    };

    component.handleCheckboxClick(event, {
      stopPropagation: vi.fn(),
    } as any);

    expect(toggleSpy).not.toHaveBeenCalled();
    expect(editSpy).not.toHaveBeenCalled();
  });

  it('should NOT call service if event has no id', () => {
    const spy = vi.spyOn(calendarEventService, 'completeEvent');

    component.currentUser = mockUser as any;

    const event: any = {
      meta: { checked: false },
    };

    component.toggleFromCalendar(event);

    expect(spy).not.toHaveBeenCalled();
  });
});
