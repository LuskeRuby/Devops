import { Component, input, output } from '@angular/core';
// Import the icon components and the module
import { LucideAngularModule, Pencil, Trash2 } from 'lucide-angular';
import { User } from '../../../services/user.service';

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
  isCurrentUser = input<boolean>();

  deleteMember = output<void>();
  edit = output<void>();

  readonly PencilIcon = Pencil;
  readonly TrashIcon = Trash2;
}
