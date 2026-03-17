import { Routes } from '@angular/router';
import { SelectMemberPageComponent } from './components/select-member-page/select-member-page.component';
import { HomePageComponent } from './components/home-page/home-page.component';
import { CreateMemberPageComponent } from './components/create-member-page/create-member-page';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { AuthGuard } from './auth/auth.guard';
import { MessageComponent } from './components/message-page/message-page.component';
import { TotalPointsDisplayComponent } from './components/total-points-display/total-points-display';
import { PointsProgressComponent } from './components/points-progress/points-progress.component';
import { RewardsDisplayComponent } from './components/rewards-display/rewards-display.component';
import { MemberPinPageComponent } from './components/member-pin-page/member-pin-page.component';
import { CalendarComponent } from './components/calendar/calendar';
import { TaskPageComponent } from './components/task-page/task-page';
import { DashboardPage } from './components/dashboard-page/dashboard-page';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'select-member', component: SelectMemberPageComponent, canActivate: [AuthGuard] },
  { path: 'member-pin', component: MemberPinPageComponent, canActivate: [AuthGuard] },
  { path: 'create-member-page', component: CreateMemberPageComponent, canActivate: [AuthGuard] },
  { path: 'home', component: HomePageComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'calendar', component: CalendarComponent, canActivate: [AuthGuard] },
  { path: 'message', component: MessageComponent, canActivate: [AuthGuard] },
  { path: 'test-total-points', component: TotalPointsDisplayComponent },
  { path: 'test-points-progress', component: PointsProgressComponent },
  { path: 'test-rewards-display', component: RewardsDisplayComponent },
  { path: 'dashboard', component: DashboardPage }
];
