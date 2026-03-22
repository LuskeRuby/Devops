import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { CalendarComponent } from './calendar';
import { CalendarEventService } from '../../services/calendar-event.service';
import { UserService } from '../../services/user.service';

describe('CalendarComponent', () => {
  let component: CalendarComponent;
  let calendarEventService: {
    loadFamilyEvents: ReturnType<typeof vi.fn>;
    createEvent: ReturnType<typeof vi.fn>;
    updateEvent: ReturnType<typeof vi.fn>;
    completeEvent: ReturnType<typeof vi.fn>;
  };
  let userService: {
    currentUser: ReturnType<typeof vi.fn>;
    getUsersByFamilyEmail: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    calendarEventService = {
      loadFamilyEvents: vi.fn(),
      createEvent: vi.fn(),
      updateEvent: vi.fn(),
      completeEvent: vi.fn()
    };

    userService = {
      currentUser: vi.fn(),
      getUsersByFamilyEmail: vi.fn()
    };

    router = { navigate: vi.fn() };

    component = new CalendarComponent(
      {} as any,
      calendarEventService as unknown as CalendarEventService,
      userService as unknown as UserService,
      router as any
    );
  });

  it('loads events using nested family email fallback and emits refresh', () => {
    const refreshSpy = vi.fn();
    component.refresh.subscribe(refreshSpy);

    userService.currentUser.mockReturnValue({
      id: 1,
      name: 'Parent',
      email: 'parent@example.com',
      family: { email: 'family@example.com' }
    });

    calendarEventService.loadFamilyEvents.mockReturnValue(of([]));

    component.loadEvents();

    expect(calendarEventService.loadFamilyEvents).toHaveBeenCalledWith('family@example.com');
    expect(refreshSpy).toHaveBeenCalled();
  });

  it('emits refresh and sets load error when loading events fails', () => {
    const refreshSpy = vi.fn();
    component.refresh.subscribe(refreshSpy);

    userService.currentUser.mockReturnValue({
      id: 1,
      name: 'Parent',
      email: 'parent@example.com',
      familyEmail: 'family@example.com',
      family: { email: 'family@example.com' }
    });

    calendarEventService.loadFamilyEvents.mockReturnValue(
      throwError(() => new Error('load failed'))
    );

    component.loadEvents();

    expect(component.events).toEqual([]);
    expect(component.loadError).toBe('Failed to load family calendar tasks.');
    expect(refreshSpy).toHaveBeenCalled();
  });

  it('reloads events after successful create', () => {
    const loadEventsSpy = vi.spyOn(component, 'loadEvents');

    calendarEventService.createEvent.mockReturnValue(of({} as any));

    (component as any).handleDialogResult({
      mode: 'save',
      title: 'New event',
      description: 'Details',
      start: new Date('2026-01-01T08:00:00'),
      end: new Date('2026-01-01T09:00:00'),
      userIds: [1]
    });

    expect(calendarEventService.createEvent).toHaveBeenCalled();
    expect(loadEventsSpy).toHaveBeenCalled();
  });
});
