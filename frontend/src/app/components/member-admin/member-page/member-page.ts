import { Component } from '@angular/core';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { MemberListComponent } from '../member-list/member-list';

@Component({
  selector: 'app-member-page',
  imports: [SidebarComponent, MemberListComponent],
  templateUrl: './member-page.html',
  styleUrl: './member-page.scss',
})
export class AdminMemberPage {}
