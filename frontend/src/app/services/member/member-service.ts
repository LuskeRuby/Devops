import {Injectable, signal, computed, inject, OnInit} from '@angular/core';
import {User, UserService} from '../user.service';

@Injectable({
  providedIn: 'root'
})
export class MemberService implements OnInit {
  private userService = inject(UserService);

  private familyEmail: string = "";
  private membersSignal = signal<User[]>([]);

  members = this.membersSignal.asReadonly();


  ngOnInit() {
    this.loadMembers()
  }

  loadMembers(): void {

    const currentUser = this.userService.currentUser();

    if (!currentUser) {
      console.error("No current user found. Cannot load members.");
      return;
    }

    this.familyEmail = currentUser.email;

    this.userService.getUsersByFamilyEmail(this.familyEmail).subscribe({
      next: (members) => this.setMembers(members),
      error: (error) => console.error('Error loading members:', error)
    });
  }

  setMembers(newMembers: User[]) {
    this.membersSignal.set(newMembers);
  }

  addMember(member: User) {
    this.membersSignal.update(prev => [...prev, member]);
  }
}
