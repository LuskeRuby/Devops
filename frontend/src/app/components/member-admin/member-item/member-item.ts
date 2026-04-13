import { Component, inject, input, output, computed } from '@angular/core';
import { LucideAngularModule, Pencil, Trash2 } from 'lucide-angular';
import { User, UserService } from '../../../services/user.service';
import { MemberPointEditorComponent } from '../member-point-editor/member-point-editor';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AvatarSelectorComponent } from '../avatar-selector/avatar-selector';

@Component({
  selector: 'app-member-item',
  standalone: true,
  imports: [LucideAngularModule, MemberPointEditorComponent, MatDialogModule],
  templateUrl: 'member-item.html',
  styleUrl: 'member-item.scss'
})
export class MemberItemComponent {
  private userService = inject(UserService);
  private dialog = inject(MatDialog);

  member = input.required<User>();
  showActions = input<boolean>(false);
  isCurrentUser = input<boolean>();

  canEditAvatar = computed(() => {
    const currentUser = this.userService.currentUser();
    return currentUser?.role?.toLowerCase() === 'parent';
  });

  deleteMember = output<void>();
  edit = output<void>();
  memberUpdated = output<void>();

  readonly PencilIcon = Pencil;
  readonly TrashIcon = Trash2;

  getImageUrl(imageId: number | undefined): string {
    return this.userService.getImageUrl(imageId);
  }

  openAvatarSelector(): void {
    if (!this.canEditAvatar()) return;

    const dialogRef = this.dialog.open(AvatarSelectorComponent, {
      width: '500px',
      data: { memberRole: this.member().role }
    });

    dialogRef.afterClosed().subscribe(newImageId => {
      if (newImageId) {
        this.userService.setProfileImage(this.member().id, newImageId).subscribe(() => {
          this.memberUpdated.emit();
        });
      }
    });
  }
}
