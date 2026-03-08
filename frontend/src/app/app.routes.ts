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

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'select-member', component: SelectMemberPageComponent, canActivate: [AuthGuard] },
  { path: 'create-member-page', component: CreateMemberPageComponent, canActivate: [AuthGuard] },
  { path: 'home', component: HomePageComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'message', component: MessageComponent, canActivate: [AuthGuard] },
  { path: 'test-total-points', component: TotalPointsDisplayComponent },
  { path: 'test-points-progress', component: PointsProgressComponent },
  { path: 'test-rewards-display', component: RewardsDisplayComponent }
];
