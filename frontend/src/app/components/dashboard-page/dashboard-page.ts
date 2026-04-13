import { Component, OnInit, inject, LOCALE_ID, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarComponent } from '../calendar/calendar';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CalendarComponent, SidebarComponent],
  providers: [{ provide: LOCALE_ID, useValue: 'da' }],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage implements OnInit {
  private userService = inject(UserService);
  @ViewChild(CalendarComponent) calendarComponent!: CalendarComponent;
  viewDate: Date = new Date();
  isDayView = false;

  private readonly STORAGE_KEY = 'calendar_view_preference';

  ngOnInit(): void {
    const user = this.userService.currentUser();
    const role = user?.role?.toUpperCase();
    const savedView = localStorage.getItem(this.STORAGE_KEY);

    this.isDayView = savedView ? savedView === 'day' : role === 'CHILD';
  }

  previous() {
    const date = new Date(this.viewDate);
    if (this.isDayView) {
      date.setDate(date.getDate() - 1);
    } else {
      date.setDate(date.getDate() - 7);
    }
    this.viewDate = date;
  }

  next() {
    const date = new Date(this.viewDate);
    if (this.isDayView) {
      date.setDate(date.getDate() + 1);
    } else {
      date.setDate(date.getDate() + 7);
    }
    this.viewDate = date;
  }

  goToToday() {
    this.viewDate = new Date();
  }

  isToday(): boolean {
    const today = new Date();
    return (
      this.viewDate.getDate() === today.getDate() &&
      this.viewDate.getMonth() === today.getMonth() &&
      this.viewDate.getFullYear() === today.getFullYear()
    );
  }

  onViewChanged(isDay: boolean) {
    this.isDayView = isDay;
    localStorage.setItem(this.STORAGE_KEY, isDay ? 'day' : 'week');
  }

  get isParent(): boolean {
    return this.userService.currentUser()?.role?.toUpperCase() === 'PARENT';
  }

  createTask(): void {
    if (this.calendarComponent) {
      this.calendarComponent.openCreateDialog(new Date());
    }
  }
}
