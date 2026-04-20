import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CalendarEventDialogComponent } from './calendar-event-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { vi } from 'vitest';

describe('CalendarEventDialogComponent', () => {
  let component: CalendarEventDialogComponent;
  let fixture: ComponentFixture<CalendarEventDialogComponent>;
  let dialogRef: any;

  const mockData = {
    title: 'Test Event',
    description: 'Desc',
    start: new Date('2024-01-01T10:00:00'),
    end: new Date('2024-01-01T11:00:00'),
    selectedUserIds: [1],
    users: [{ id: 1, name: 'User 1' }],
    points: 5,
    isReadOnly: false,
  };

  beforeEach(async () => {
    dialogRef = {
      close: vi.fn(),
    };

    const userServiceMock = {
      getImageUrl: vi.fn().mockReturnValue('mock-url'),
    };

    await TestBed.configureTestingModule({
      imports: [CalendarEventDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { ...mockData } },
        { provide: UserService, useValue: userServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarEventDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ---------------- INIT ----------------

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize from data', () => {
    expect(component.title).toBe('Test Event');
    expect(component.description).toBe('Desc');
    expect(component.selectedUserIds).toEqual([1]);
    expect(component.points).toBe(5);
    expect(component.isReadOnly).toBe(false);
  });

  // ---------------- USERS ----------------

  it('should add user if not selected', () => {
    component.selectedUserIds = [];

    component.toggleUser(1);

    expect(component.selectedUserIds).toContain(1);
  });

  it('should remove user if already selected', () => {
    component.selectedUserIds = [1];

    component.toggleUser(1);

    expect(component.selectedUserIds).not.toContain(1);
  });

  // ---------------- VALIDATION ----------------

  it('should return false if title is empty', () => {
    component.title = '';
    component.selectedUserIds = [1];

    expect(component.canSave()).toBe(false);
  });

  it('should return false if no users selected', () => {
    component.title = 'Test';
    component.selectedUserIds = [];

    expect(component.canSave()).toBe(false);
  });

  it('should return false if dates are invalid', () => {
    component.title = 'Test';
    component.selectedUserIds = [1];
    component.startLocal = 'invalid';
    component.endLocal = 'invalid';

    expect(component.canSave()).toBe(false);
  });

  it('should return false if end is before start', () => {
    component.title = 'Test';
    component.selectedUserIds = [1];
    component.startLocal = '2024-01-01T12:00';
    component.endLocal = '2024-01-01T10:00';

    expect(component.canSave()).toBe(false);
  });

  it('should return true for valid input', () => {
    component.title = 'Test';
    component.selectedUserIds = [1];
    component.startLocal = '2024-01-01T10:00';
    component.endLocal = '2024-01-01T11:00';

    expect(component.canSave()).toBe(true);
  });

  // ---------------- SAVE ----------------

  it('should NOT save if invalid', () => {
    component.title = '';

    component.save();

    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('should close dialog with save result (create)', () => {
    component.title = 'Test';
    component.description = 'Desc';
    component.selectedUserIds = [1];
    component.startLocal = '2024-01-01T10:00';
    component.endLocal = '2024-01-01T11:00';
    component.isSeparateTasks = true;
    component.points = 10;

    component.data.eventId = undefined;

    component.save();

    expect(dialogRef.close).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'save',
        title: 'Test',
        description: 'Desc',
        userIds: [1],
        points: 10,
        isSeparateTasks: true,
      }),
    );
  });

  it('should close dialog with update result', () => {
    component.title = 'Test';
    component.selectedUserIds = [1];
    component.startLocal = '2024-01-01T10:00';
    component.endLocal = '2024-01-01T11:00';

    component.data.eventId = 123;

    component.save();

    expect(dialogRef.close).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'update',
        eventId: 123,
      }),
    );
  });

  // ---------------- CLOSE ----------------

  it('should close dialog without result', () => {
    component.close();

    expect(dialogRef.close).toHaveBeenCalledWith();
  });

  // ---------------- HELPERS ----------------

  it('should convert date to local input format', () => {
    const date = new Date('2024-01-01T10:00:00Z');

    const result = (component as any).toLocalInput(date);

    expect(result).toMatch(/2024-01-01T/);
  });
});
