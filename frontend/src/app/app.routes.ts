import { Routes } from '@angular/router';
import{SelectMemberPageComponent} from './components/select-member-page/select-member-page.component';
import{HomePageComponent} from './components/home-page/home-page.component';
import { TaskPageComponent } from './components/task-page/task-page';

export const routes: Routes = [
  { path: '', component: TaskPageComponent },
  {path:'select-member',component:SelectMemberPageComponent},
  {path:'home',component:HomePageComponent}


  ];
