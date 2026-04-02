import {Component, inject, input, output} from '@angular/core';
import { LucideAngularModule, Pencil, Trash2 } from 'lucide-angular';
import { User, UserService } from '../../../services/user.service';
import { MemberPointEditorComponent } from '../member-point-editor/member-point-editor';

@Component({
  selector: 'app-member-item',
  standalone: true,
  imports: [LucideAngularModule, MemberPointEditorComponent],
  templateUrl: 'member-item.html',
  styleUrl: 'member-item.scss'
})
export class MemberItemComponent {
  userService = inject(UserService);
  member = input.required<User>();
  showActions = input<boolean>(false);
  isCurrentUser = input<boolean>();


  deleteMember = output<void>();
  edit = output<void>();

  readonly PencilIcon = Pencil;
  readonly TrashIcon = Trash2;

  getImageUrl(imageId: number | undefined): string {
    return this.userService.getImageUrl(imageId);
  }
}
