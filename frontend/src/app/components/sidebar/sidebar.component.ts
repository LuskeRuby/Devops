import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService, User } from '../../services/user.service';
import {MemberService} from '../../services/member/member-service';
import { TotalPointsDisplayComponent } from '../total-points-display/total-points-display';
import { PointsStore } from '../../services/points-store.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TotalPointsDisplayComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {

  private memberService = inject(MemberService);
  private userService: UserService = inject(UserService);
  private pointsStore = inject(PointsStore);
  currentUser = this.userService.currentUser;

  members = this.memberService.members;

  get isParent(): boolean {
    return this.currentUser()?.role?.toUpperCase() === 'PARENT';
  }

  ngOnInit(): void {
    const user = this.currentUser();
    if (user) {
      this.pointsStore.loadUser(user.id);
    }

    const familyEmail = user?.familyEmail;
    if (!familyEmail) return;

    this.userService.getUsersByFamilyEmail(familyEmail).subscribe({
      next: (members) => {
        this.memberService.setMembers(members);
      },
      error: (err) => console.error('Failed to load family members:', err),
    });
  }

  getImageUrl(imageId: number | undefined): string {
    return this.userService.getImageUrl(imageId);
  }

  onLogout(): void {
    this.userService.logoutUser();
  }
}
