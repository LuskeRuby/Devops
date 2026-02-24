import { Routes } from '@angular/router';
import{SelectMemberPageComponent} from './components/select-member-page/select-member-page.component';
import{HomePageComponent} from './components/home-page/home-page.component';
import{CreateMemberPageComponent} from './components/create-member-page/create-member-page';

export const routes: Routes = [
  {path:'',redirectTo:'/select-member',pathMatch:'full'},
  {path:'select-member',component:SelectMemberPageComponent},
  {path:'home',component:HomePageComponent},
  {path:'create-member-page',component:CreateMemberPageComponent}
  ];
