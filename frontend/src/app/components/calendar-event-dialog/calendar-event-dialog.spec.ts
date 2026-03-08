import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarEventDialog } from './calendar-event-dialog';

describe('CalendarEventDialog', () => {
  let component: CalendarEventDialog;
  let fixture: ComponentFixture<CalendarEventDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarEventDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarEventDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
