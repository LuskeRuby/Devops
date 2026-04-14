import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { MemberItemComponent } from '../member-item/member-item';
import { LucideAngularModule, Plus, Settings, Check } from 'lucide-angular';
import { User, UserService } from '../../../services/user.service';
import { Router } from '@angular/router';
import { MemberService } from '../../../services/member/member-service';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [MemberItemComponent, LucideAngularModule],
  templateUrl: 'member-list.html',
  styleUrl: 'member-list.scss',
})
export class MemberListComponent implements OnInit {
  readonly PlusIcon = Plus;
  readonly EditIcon = Settings;
  readonly DoneIcon = Check;

  isEditMode = signal<boolean>(false);

  private memberService = inject(MemberService);
  private userService = inject(UserService);
  private router = inject(Router);

  members = this.memberService.members;
  currentMember: User | null = this.userService.currentUser();

  sortedMembers = computed(() => {
    return [...this.members()].sort((a, b) => a.name.localeCompare(b.name));
  });

  ngOnInit(): void {
    if (this.currentMember?.role != 'parent') {
      this.router.navigate(['/dashboard']);
    }
  }

  loadMembers(): void {
    this.memberService.loadMembers();
  }

  toggleEditMode() {
    this.isEditMode.update((val) => !val);
  }

  handleEdit(memberToEdit: User) {
    this.router.navigate(['/edit-member', memberToEdit.id], {
      state: { returnUrl: this.router.url },
    });
  }

  handleDelete(memberToDelete: User) {
    if (memberToDelete.id === this.currentMember?.id) {
      alert('Du kan ikke slette din egen profil');
      return;
    }

    if (!confirm(`Er du sikker på, at du vil slette ${memberToDelete.name}?`)) {
      return;
    }

    this.userService.deleteUser(memberToDelete.id).subscribe({
      next: () => {
        const updatedList = this.members().filter((m) => m.id !== memberToDelete.id);
        this.memberService.setMembers(updatedList);
      },
      error: (error) => console.error('Error deleting member:', error),
    });
  }

  handleAdd() {
    this.router.navigate(['/create-member-page'], {
      state: { returnUrl: this.router.url },
    });
  }
}
