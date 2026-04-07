import localeDa from '@angular/common/locales/da';
import { Component, LOCALE_ID, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { CalendarEventTimesChangedEvent } from 'angular-calendar';

import {
  CalendarDateFormatter,
  CalendarEvent,
  CalendarModule,
  DateFormatterParams,
  DateAdapter
} from 'angular-calendar';

import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { CommonModule, registerLocaleData } from '@angular/common';
import { format } from 'date-fns';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CalendarEventDialogComponent, CalendarEventDialogResult } from '../calendar-event-dialog/calendar-event-dialog';
import { CalendarEventService } from '../../services/calendar-event.service';
import { CalendarTaskMeta } from '../../features/task/models/CalendarTaskMeta';
import { User, UserService } from '../../services/user.service';
import { PointsStore } from '../../services/points-store.service';

registerLocaleData(localeDa);

export class DanishCalendarDateFormatter extends CalendarDateFormatter {
  override weekViewHour({ date }: DateFormatterParams): string {
    return format(date, 'HH:mm');
  }

  override dayViewHour({ date }: DateFormatterParams): string {
    return format(date, 'HH:mm');
  }
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CalendarModule,
    CommonModule,
    MatDialogModule,
    FormsModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'da-DK' },
    { provide: CalendarDateFormatter, useClass: DanishCalendarDateFormatter },
    { provide: DateAdapter, useFactory: adapterFactory }
  ],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.scss']
})
export class CalendarComponent implements OnInit {

  constructor(
    private dialog: MatDialog,
    private calendarEventService: CalendarEventService,
    private userService: UserService,
    private pointsStore: PointsStore
  ) { }

  @Input() viewDate: Date = new Date();
  @Input() isDayView = false;
  @Output() viewChange = new EventEmitter<boolean>();

  locale = 'da';
  weekStartsOn = 1;

  events: CalendarEvent<CalendarTaskMeta>[] = [];
  familyUsers: User[] = [];
  loadError: string | null = null;
  refresh = new Subject<void>();
  currentUser: User | null = null;

  get isParent(): boolean {
    return this.currentUser?.role?.toUpperCase() === 'PARENT';
  }

  ngOnInit(): void {
    this.currentUser = this.userService.currentUser();
    this.loadFamilyUsers();
    this.loadEvents();
  }

  toggleView(): void {
    this.isDayView = !this.isDayView;
    this.viewChange.emit(this.isDayView);
  }

  // ---------------- EVENTS ----------------

  loadEvents(): void {
    const familyEmail = this.getFamilyEmail();
    const userId = this.currentUser?.id;

    if (!familyEmail) {
      this.events = [];
      this.loadError = 'Missing family';
      this.refresh.next();
      return;
    }

    const request$ = this.isParent
      ? this.calendarEventService.loadFamilyEvents(familyEmail, userId)
      : this.calendarEventService.loadUserEvents(userId!);

    request$.subscribe({
      next: events => {
        console.log('Loaded events:', events);
        this.events = events.map(event => ({
          ...event,
          draggable: this.isParent && !event.meta?.checked,
          resizable: {
            beforeStart: this.isParent && !event.meta?.checked,
            afterEnd: this.isParent && !event.meta?.checked
          }
        }));
        this.loadError = null;
        this.refresh.next();
      },
      error: () => {
        console.error('Error loading events:');
        this.events = [];
        this.loadError = 'Failed to load events';
        this.refresh.next();
      }
    });
  }

  loadFamilyUsers(): void {
    const user = this.userService.currentUser();
    const familyEmail = this.getFamilyEmail();

    if (!familyEmail) {
      this.familyUsers = user ? [user] : [];
      return;
    }

    this.userService.getUsersByFamilyEmail(familyEmail).subscribe({
      next: users => this.familyUsers = users,
      error: () => this.familyUsers = user ? [user] : []
    });
  }

  // ---------------- CLICK HANDLING ----------------

  onHourSegmentClicked(event: { date: Date; sourceEvent?: MouseEvent }): void {
    if (!this.isParent) return;
    const target = event.sourceEvent?.target as HTMLElement;

    if (target?.closest('.custom-event')) return;

    this.openCreateDialog(event.date);
  }

  onEventTemplateClick(
    event: CalendarEvent<CalendarTaskMeta>,
    mouseEvent: MouseEvent | KeyboardEvent
  ): void {
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    if (this.isParent) {
      this.openEditDialog(event);
    }
  }

  // drag and drop and resize
  // TODO: needs validate.  not drag before current time, not drag to end before start, etc
  onEventTimesChanged({ event, newStart, newEnd }: CalendarEventTimesChangedEvent<CalendarTaskMeta>): void {
    const taskId = event.id as number;
    if (!taskId) return;

    // optimistic UI update
    this.events = this.events.map(e =>
      e.id === event.id
        ? { ...e, start: newStart, end: newEnd ?? e.end }
        : e
    );
    this.refresh.next();

    const payload = {
      title: event.title ?? '',
      description: event.meta?.description ?? '',
      start: newStart,
      end: newEnd ?? event.end ?? new Date(newStart.getTime() + 60 * 60 * 1000),
      userIds: event.meta?.assignedUserIds ?? [],
      points: event.meta?.points ?? 0,
      color: '#4285f4'
    };

    this.calendarEventService.updateEvent(taskId, payload, this.currentUser?.id).subscribe({
      next: () => this.loadEvents(),
      error: () => {
        this.loadError = 'Failed to move event';
        this.loadEvents(); // rollback from server truth
      }
    });
  }


  // ---------------- DIALOGS ----------------

  openCreateDialog(start: Date): void {
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const current = this.userService.currentUser();

    const dialogRef = this.dialog.open(CalendarEventDialogComponent, {
      width: '460px',
      data: {
        start,
        end,
        users: this.familyUsers,
        selectedUserIds: current ? [current.id] : [],
        isReadOnly: !this.isParent
      }
    });

    dialogRef.afterClosed().subscribe(result => this.handleDialog(result));
  }

  openEditDialog(event: CalendarEvent<CalendarTaskMeta>): void {
    const dialogRef = this.dialog.open(CalendarEventDialogComponent, {
      width: '460px',
      data: {
        eventId: event.id,
        title: event.title,
        description: event.meta?.description,
        start: event.start,
        end: event.end ?? new Date(event.start.getTime() + 60 * 60 * 1000),
        users: this.familyUsers,
        selectedUserIds: event.meta?.assignedUserIds ?? [],
        points: event.meta?.points ?? 0,
        isReadOnly: !this.isParent
      }
    });

    dialogRef.afterClosed().subscribe(result =>
      this.handleDialog(result, event.id as number)
    );
  }

  // ---------------- SAVE ----------------

  handleDialog(result?: CalendarEventDialogResult, eventId?: number): void {
    if (!result) return;

    const payload = {
      title: result.title,
      description: result.description,
      start: result.start,
      end: result.end,
      userIds: result.userIds,
      isSeparateTasks: result.isSeparateTasks,
      points: result.points,
      color: '#4285f4'
    };

    const request$ = result.mode === 'update'
      ? this.calendarEventService.updateEvent(result.eventId ?? eventId!, payload, this.currentUser?.id)
      : this.calendarEventService.createEvent(payload, this.currentUser?.id);

    request$.subscribe({
      next: () => this.loadEvents(),
      error: () => this.loadError = 'Failed to save event'
    });
  }

  handleCheckboxClick(event: CalendarEvent<CalendarTaskMeta>, mouseEvent: MouseEvent): void {
    mouseEvent.stopPropagation();

    if (this.isParent && !this.canToggleTask(event)) {
      // Parents clicking a child's task checkbox should get the edit dialog
      this.openEditDialog(event);
      return;
    }

    if (this.canToggleTask(event)) {
      this.toggleFromCalendar(event);
    }
  }

  canToggleTask(event: CalendarEvent<CalendarTaskMeta>): boolean {
    if (!this.currentUser || !event.meta) return false;

    const userId = this.currentUser.id;
    const isAssigned = event.meta.assignedUserIds?.includes(userId);

    return !!isAssigned;
  }

  // ---------------- COMPLETE ----------------

  toggleFromCalendar(event: CalendarEvent<CalendarTaskMeta>): void {
    const taskId = event.id as number;
    if (!taskId) return;

    const action$ = event.meta?.checked
      ? this.calendarEventService.uncompleteEvent(taskId, this.currentUser?.id)
      : this.calendarEventService.completeEvent(taskId, this.currentUser?.id);

    action$.subscribe({
      next: () => {
        this.loadEvents();
        const user = this.currentUser;
        if (user) {
          this.pointsStore.loadUser(user.id);
        }
      },
      error: (err) => {
        console.error('Task update failed:', err);
        this.loadError = 'Failed to update task';
        this.loadEvents();
      }
    });
  }

  // ---------------- HELPERS ----------------

  private getFamilyEmail(): string | null {
    const user = this.userService.currentUser();
    return user?.familyEmail ?? user?.family?.email ?? null;
  }
}
