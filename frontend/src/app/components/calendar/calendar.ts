import localeDa from '@angular/common/locales/da';
import { Component, LOCALE_ID } from '@angular/core';
import { Input } from '@angular/core';

import {
  CalendarDateFormatter,
  CalendarModule,
  DateAdapter,
  DateFormatterParams
} from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { CommonModule, registerLocaleData } from '@angular/common';
import { format } from 'date-fns';

import { CalendarEvent } from 'angular-calendar';

import { MatDialog } from '@angular/material/dialog';
import { CalendarEventDialogComponent } from '../calendar-event-dialog/calendar-event-dialog';
import { MatDialogModule } from '@angular/material/dialog';


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
    MatDialogModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'da-DK' },
    { provide: CalendarDateFormatter, useClass: DanishCalendarDateFormatter }
  ],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss'
})

// to display a calendar with Danish locale and 24-hour time format
export class CalendarComponent {
  constructor(private dialog: MatDialog) {}

  @Input() viewDate: Date = new Date();
  locale = 'da-DK';
  weekStartsOn = 1;

  events: CalendarEvent[] = [
    {
      start: new Date(),
      title: 'Test Event',
      color: {
        primary: '#1e90ff',
        secondary: '#D1E8FF'
      }
    }
  ];

  handleHourClick({ date }: { date: Date }): void {
    const dialogRef = this.dialog.open(CalendarEventDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      const newEvent: CalendarEvent = {
        start: date,
        end: new Date(date.getTime() + 60 * 60 * 1000),
        title: result,
        color: {
          primary: '#4285f4',
          secondary: '#D1E8FF'
        }
      };

      this.events = [...this.events, newEvent];
    });
  }

  handleEventClick(event: CalendarEvent): void {
    const dialogRef = this.dialog.open(CalendarEventDialogComponent, {
      width: '400px',
      data: { title: event.title }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      event.title = result;

      // Trigger change detection
      this.events = [...this.events];
    });
  }
}
