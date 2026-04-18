import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskListComponent } from './task-list';
import { UserService } from '../../../../services/user.service';
import { CalendarEventService } from '../../../../services/calendar-event.service';
import { PointsStore } from '../../../../services/points-store.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;

  beforeEach(async () => {
    const userServiceMock = {
      currentUser: signal({ id: 1, familyEmail: 'test@test.com' }),
      getTasksByUserId: () => of([]),
    };
    const calendarEventServiceMock = {};
    const pointsStoreMock = {};

    await TestBed.configureTestingModule({
      imports: [TaskListComponent],
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: CalendarEventService, useValue: calendarEventServiceMock },
        { provide: PointsStore, useValue: pointsStoreMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
