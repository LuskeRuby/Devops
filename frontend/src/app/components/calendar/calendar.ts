import localeDa from '@angular/common/locales/da';
import { Component, LOCALE_ID } from '@angular/core';
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
    CommonModule
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
  viewDate: Date = new Date();
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
}
