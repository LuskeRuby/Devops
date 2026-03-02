import { Routes } from '@angular/router';
import{SelectMemberPageComponent} from './components/select-member-page/select-member-page.component';
import{HomePageComponent} from './components/home-page/home-page.component';
import{LoginComponent} from './components/auth/login/login.component';
import{RegisterComponent} from './components/auth/register/register.component';
import{AuthGuard} from './auth/auth.guard';

export const routes: Routes = [
  {path:'',redirectTo:'/select-member',pathMatch:'full'},
  {path:'select-member',component:SelectMemberPageComponent},
  {path:'home',component:HomePageComponent, canActivate: [AuthGuard]},
  {path:'login', component: LoginComponent},
  {path:'register', component: RegisterComponent}
  ];
