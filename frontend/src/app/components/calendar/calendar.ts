import localeDa from '@angular/common/locales/da';
import { Component, LOCALE_ID, OnInit } from '@angular/core';
import { Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CalendarDateFormatter,
  CalendarEvent,
  CalendarModule,
  DateFormatterParams
} from 'angular-calendar';

import { CommonModule, registerLocaleData } from '@angular/common';
import { format } from 'date-fns';

import { MatDialog } from '@angular/material/dialog';
import { CalendarEventDialogComponent, CalendarEventDialogResult } from '../calendar-event-dialog/calendar-event-dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { CalendarEventService } from '../../services/calendar-event.service';
import { User, UserService } from '../../services/user.service';
import { Router } from '@angular/router';

registerLocaleData(localeDa);

export class DanishCalendarDateFormatter extends CalendarDateFormatter {
  override weekViewHour({ date }: DateFormatterParams): string {
    return format(date, 'HH:mm'); // 24-hour
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
    FormsModule // for 1/7 day view
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'da-DK' },
    { provide: CalendarDateFormatter, useClass: DanishCalendarDateFormatter }
  ],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss'
})

// to display a calendar with Danish locale and 24-hour time format
export class CalendarComponent implements OnInit {
  constructor(
    private dialog: MatDialog,
    private calendarEventService: CalendarEventService,
    private userService: UserService,
    private router: Router
  ) {}

  @Input() viewDate: Date = new Date();
  locale = 'da-DK';
  weekStartsOn = 1;
  isDayView = false;

  events: CalendarEvent[] = [];
  familyUsers: User[] = [];

  ngOnInit(): void {
    this.loadFamilyUsers();
    this.loadEvents();
  }

  loadEvents(): void {
    const user = this.userService.currentUser();
    if (!user) return;

    const source$ = user.familyEmail
      ? this.calendarEventService.loadFamilyEvents(user.familyEmail)
      : this.calendarEventService.loadUserEvents(user.id);

    source$.subscribe({
      next: events => (this.events = events),
      error: err => console.error('Failed to load calendar events:', err)
    });
  }

  loadFamilyUsers(): void {
    const user = this.userService.currentUser();
    if (!user?.familyEmail) {
      this.familyUsers = user ? [user] : [];
      return;
    }

    this.userService.getUsersByFamilyEmail(user.familyEmail).subscribe({
      next: users => (this.familyUsers = users),
      error: err => {
        console.error('Failed to load family users:', err);
        this.familyUsers = [user];
      }
    });
  }

  handleHourClick({ date }: { date: Date }): void {
    const end = new Date(date.getTime() + 60 * 60 * 1000);
    const current = this.userService.currentUser();

    const dialogRef = this.dialog.open(CalendarEventDialogComponent, {
      width: '460px',
      data: {
        start: date,
        end,
        users: this.familyUsers,
        selectedUserIds: current ? [current.id] : []
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.handleDialogResult(result);
    });
  }

  handleEventClick(event: CalendarEvent): void {
    const dialogRef = this.dialog.open(CalendarEventDialogComponent, {
      width: '460px',
      data: {
        eventId: event.id as number | undefined,
        title: event.title,
        description: event.meta?.description,
        start: event.start,
        end: event.end ?? new Date(event.start.getTime() + 60 * 60 * 1000),
        users: this.familyUsers,
        selectedUserIds: []
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.handleDialogResult(result, event.id as number | undefined);
    });
  }

  completeFromCalendar(event: CalendarEvent, mouseEvent: MouseEvent): void {
    mouseEvent.stopPropagation();

    const taskId = event.id as number | undefined;
    if (!taskId || event.meta?.checked) return;

    this.calendarEventService.completeEvent(taskId).subscribe({
      next: () => this.loadEvents(),
      error: err => console.error('Failed to complete task:', err)
    });
  }

  private handleDialogResult(
    result: CalendarEventDialogResult | undefined,
    eventId?: number
  ): void {
    if (!result) return;

    if (result.mode === 'edit') {
      this.router.navigate(['/task'], {
        queryParams: {
          taskId: result.eventId ?? eventId,
          title: result.title
        }
      });
      return;
    }

    this.calendarEventService.createEvent({
      title: result.title,
      description: result.description,
      start: result.start,
      end: result.end,
      userIds: result.userIds
    }).subscribe({
      next: () => this.loadEvents(),
      error: err => console.error('Failed to create calendar event:', err)
    });
  }
}
