import { Component, signal } from '@angular/core';
import { MemberItemComponent } from '../member-item/member-item';
import { LucideAngularModule, Plus, Settings, Check } from 'lucide-angular';
import { User, UserService } from '../../../services/user.service';
import { AuthService } from '../../../auth/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateMemberDialogCompoenent } from '../../create-member-dialog/create-member-dialog';
import { email } from '@angular/forms/signals';


@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [MemberItemComponent, LucideAngularModule], 
  templateUrl: 'member-list.html',
  styleUrl: 'member-list.scss'
})
export class MemberListComponent {
  readonly PlusIcon = Plus;
  readonly EditIcon = Settings;
  readonly DoneIcon = Check;

  isEditMode = signal<boolean>(false);
  
  members = signal<User[]>([] as User[]);

  familyEmail: string | null = null;
  
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    
    const currentUser = this.userService.currentUser();
    if (!currentUser) {
      console.error("No current user found. Cannot load members.");
      return;
    }

    this.familyEmail = currentUser.email;

    this.userService.getUsersByFamilyEmail(this.familyEmail).subscribe({
      next: (members) => this.members.set(members.filter(member => member.id !== this.userService.currentUser()?.id)),
      error: (error) => console.error('Error loading members:', error)
    });
  }

  toggleEditMode() {
    this.isEditMode.update(val => !val);
  }

  handleDelete(memberToDelete: User) {    
    if(!confirm(`Are you sure you want to delete ${memberToDelete.name}? This action cannot be undone.`)) {
      return;
    }

    if(memberToDelete.id === this.userService.currentUser()?.id) {
      alert("You cannot delete your own account while logged in.");
      return;
    }
    
    this.userService.deleteUser(memberToDelete.id).subscribe({
      next: () => {
        this.members.update(members => members.filter(member => member.id !== memberToDelete.id));
      },
      error: (error) => console.error('Error deleting member:', error)
    });
  }

  handleAdd() {
    const dialogRef = this.dialog.open(CreateMemberDialogCompoenent, {
      width: '500px',
      disableClose: false, // User can click outside to close
      // You can pass data into the modal like this:
      data: { 
        familyEmail: this.userService.currentUser()?.email 
      }
    });

    // 5. Handle what happens when the modal closes
    dialogRef.afterClosed().subscribe((result: boolean) => {
      // If the component returns 'true' (e.g., successful creation), reload the list
      if (result) {
        this.loadMembers();
      }
    });
  }
}