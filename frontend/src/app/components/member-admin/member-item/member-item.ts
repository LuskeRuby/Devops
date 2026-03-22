import { Component, input, output } from '@angular/core';
import { LucideAngularModule, Pencil, Trash2 } from 'lucide-angular';
import { User, UserService } from '../../../services/user.service';

@Component({
  selector: 'app-member-item',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: 'member-item.html',
  styleUrl: 'member-item.scss'
})
export class MemberItemComponent {
  member = input.required<User>();
  showActions = input<boolean>(false);

  deleteMember = output<void>();
  edit = output<void>();

  readonly PencilIcon = Pencil;
  readonly TrashIcon = Trash2;

  constructor(private userService: UserService) {}

  getImageUrl(imageId: number | undefined): string {
    return this.userService.getImageUrl(imageId);
  }
}
