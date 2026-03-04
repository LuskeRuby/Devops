import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-select-member-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-member-page.component.html',
  styleUrls: ['./select-member-page.component.scss']
})
export class SelectMemberPageComponent implements OnInit {
  users: User[] = [];
  familyEmail = "fam1@gmail.com"; // Replace with actual family email

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsersByFamilyEmail(this.familyEmail).subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  selectUser(user: User): void {
    console.log('Selected user:', user);
    this.router.navigate(['/home']);
  }

  addMember(): void {
    console.log('Add member clicked');
    this.router.navigate(['/create-member-page']);
  }
}
