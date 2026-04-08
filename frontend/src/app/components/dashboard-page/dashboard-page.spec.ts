import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { DashboardPage } from './dashboard-page';
import { UserService } from '../../services/user.service';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  template: ''
})
class MockSidebarComponent {}


@Component({
  selector: 'app-calendar',
  standalone: true,
  template: ''
})
class MockCalendarComponent {
  @Input() viewDate!: Date;
  @Input() isDayView!: boolean;
  @Output() viewChange = new EventEmitter<boolean>();

  openCreateDialog = vi.fn();
}


describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;

  const userServiceMock = {
    currentUser: vi.fn().mockReturnValue({
      id: 1,
      role: 'PARENT'
    })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        { provide: UserService, useValue: userServiceMock }
      ]
    })
      .overrideComponent(DashboardPage, {
        set: {
          imports: [
            CommonModule,
            MockSidebarComponent,
            MockCalendarComponent
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
