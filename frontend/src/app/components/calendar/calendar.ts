import localeDa from '@angular/common/locales/da';
import { Component, LOCALE_ID, OnInit } from '@angular/core';
import { Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CalendarDateFormatter,
  CalendarModule,
  DateFormatterParams
} from 'angular-calendar';

import { CommonModule, registerLocaleData } from '@angular/common';
import { format } from 'date-fns';

import { CalendarEvent } from 'angular-calendar';

import { MatDialog } from '@angular/material/dialog';
import { CalendarEventDialogComponent } from '../calendar-event-dialog/calendar-event-dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { CalendarEventService } from '../../services/calendar-event.service';
import { UserService } from '../../services/user.service';

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
    private userService: UserService
  ) {}

  @Input() viewDate: Date = new Date();
  locale = 'da-DK';
  weekStartsOn = 1;
  isDayView = false;

  events: CalendarEvent[] = [];

  ngOnInit(): void {
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

  handleHourClick({ date }: { date: Date }): void {
    const dialogRef = this.dialog.open(CalendarEventDialogComponent, {
      width: '400px',
      data: { start: date }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      const user = this.userService.currentUser();
      if (!user) return;

      const end = new Date(date.getTime() + 60 * 60 * 1000);

      this.calendarEventService
        .createEvent(result.title, result.description, date, end, user.id)
        .subscribe({
          next: () => this.loadEvents(),
          error: err => console.error('Failed to create calendar event:', err)
        });
    });
  }

  handleEventClick(event: CalendarEvent): void {
    const dialogRef = this.dialog.open(CalendarEventDialogComponent, {
      width: '400px',
      data: {
        id: event.id,
        title: event.title,
        description: event.meta?.description,
        start: event.start
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      if (result.deleted && event.id != null) {
        this.calendarEventService.deleteEvent(event.id as number).subscribe({
          next: () => this.loadEvents(),
          error: err => console.error('Failed to delete event:', err)
        });
      }
    });
  }
}
