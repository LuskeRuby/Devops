import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, Component } from '@angular/core';
import { DashboardPage } from './dashboard-page';
import { UserService } from '../../services/user.service';

@Component({ selector: 'app-calendar', standalone: true, template: '' })
class MockCalendarComponent {
  openCreateDialog = vi.fn();
}

@Component({ selector: 'app-sidebar', standalone: true, template: '' })
class MockSidebarComponent {}

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;
  let userService: any;

  const mockParent = { id: 1, name: 'Anders', role: 'PARENT', familyEmail: 'test@family.com' };
  const mockChild = { id: 2, name: 'Maja', role: 'CHILD', familyEmail: 'test@family.com' };

  beforeEach(async () => {
    localStorage.clear();

    userService = {
      currentUser: vi.fn().mockReturnValue(mockParent),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [{ provide: UserService, useValue: userService }],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(DashboardPage, {
        set: {
          imports: [MockCalendarComponent, MockSidebarComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ---------------- BASICS ----------------

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------- ngOnInit / isDayView ----------------

  it('should default PARENT to week view when no localStorage', () => {
    component.ngOnInit();
    expect(component.isDayView).toBe(false);
  });

  it('should default CHILD to day view when no localStorage', () => {
    userService.currentUser.mockReturnValue(mockChild);
    component.ngOnInit();
    expect(component.isDayView).toBe(true);
  });

  it('should use saved "day" preference from localStorage', () => {
    localStorage.setItem('calendar_view_preference', 'day');
    component.ngOnInit();
    expect(component.isDayView).toBe(true);
  });

  it('should use saved "week" preference from localStorage', () => {
    userService.currentUser.mockReturnValue(mockChild);
    localStorage.setItem('calendar_view_preference', 'week');
    component.ngOnInit();
    expect(component.isDayView).toBe(false);
  });

  // ---------------- isParent ----------------

  it('should return true for isParent when role is PARENT', () => {
    component.ngOnInit();
    expect(component.isParent).toBe(true);
  });

  it('should return false for isParent when role is CHILD', () => {
    userService.currentUser.mockReturnValue(mockChild);
    component.ngOnInit();
    expect(component.isParent).toBe(false);
  });

  // ---------------- previous ----------------

  it('should subtract 1 day in day view', () => {
    component.isDayView = true;
    const before = new Date(component.viewDate);
    component.previous();
    const diff = before.getTime() - component.viewDate.getTime();
    expect(diff).toBe(24 * 60 * 60 * 1000);
  });

  it('should subtract 7 days in week view', () => {
    component.isDayView = false;
    const before = new Date(component.viewDate);
    component.previous();
    const diff = before.getTime() - component.viewDate.getTime();
    expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
  });

  // ---------------- next ----------------

  it('should add 1 day in day view', () => {
    component.isDayView = true;
    const before = new Date(component.viewDate);
    component.next();
    const diff = component.viewDate.getTime() - before.getTime();
    expect(diff).toBe(24 * 60 * 60 * 1000);
  });

  it('should add 7 days in week view', () => {
    component.isDayView = false;
    const before = new Date(component.viewDate);
    component.next();
    const diff = component.viewDate.getTime() - before.getTime();
    expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
  });

  // ---------------- goToToday ----------------

  it('should reset viewDate to today', () => {
    component.next();
    component.next();
    component.goToToday();
    const today = new Date();
    expect(component.viewDate.getDate()).toBe(today.getDate());
    expect(component.viewDate.getMonth()).toBe(today.getMonth());
    expect(component.viewDate.getFullYear()).toBe(today.getFullYear());
  });

  // ---------------- isToday ----------------

  it('should return true when viewDate is today', () => {
    expect(component.isToday()).toBe(true);
  });

  it('should return false after navigating away', () => {
    component.next();
    expect(component.isToday()).toBe(false);
  });

  // ---------------- onViewChanged ----------------

  it('should set isDayView=true and save "day" to localStorage', () => {
    component.onViewChanged(true);
    expect(component.isDayView).toBe(true);
    expect(localStorage.getItem('calendar_view_preference')).toBe('day');
  });

  it('should set isDayView=false and save "week" to localStorage', () => {
    component.onViewChanged(false);
    expect(component.isDayView).toBe(false);
    expect(localStorage.getItem('calendar_view_preference')).toBe('week');
  });

  // ---------------- createTask ----------------

  it('should call openCreateDialog on calendarComponent when createTask is called', () => {
    const mockCalendar = { openCreateDialog: vi.fn() };
    (component as any).calendarComponent = mockCalendar;
    component.createTask();
    expect(mockCalendar.openCreateDialog).toHaveBeenCalledWith(expect.any(Date));
  });

  it('should not throw when calendarComponent is undefined', () => {
    (component as any).calendarComponent = undefined;
    expect(() => component.createTask()).not.toThrow();
  });
});
