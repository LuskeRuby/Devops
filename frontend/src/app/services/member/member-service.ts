import { Injectable, signal, inject } from '@angular/core';
import { User, UserService } from '../user.service';

@Injectable({
  providedIn: 'root',
})
export class MemberService {
  private userService = inject(UserService);

  private familyEmail = '';
  private membersSignal = signal<User[]>([]);

  members = this.membersSignal.asReadonly();

  loadMembers(): void {
    const currentUser = this.userService.currentUser();

    if (!currentUser) {
      console.error('No current user found. Cannot load members.');
      return;
    }

    this.familyEmail = currentUser.email;

    this.userService.getUsersByFamilyEmail(this.familyEmail).subscribe({
      next: (members) => this.setMembers(members),
      error: (error) => console.error('Error loading members:', error),
    });
  }

  setMembers(newMembers: User[]) {
    this.membersSignal.set(newMembers);
  }

  addMember(member: User) {
    this.membersSignal.update((prev) => [...prev, member]);
  }
}
