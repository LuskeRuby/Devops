import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { TaskDTO } from '../../models/TaskDto';
import { DatePipe } from '@angular/common';
import { UserService } from '../../../../services/user.service';
@Component({
  selector: 'app-taskcard',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './taskcard.html',
  styleUrls: ['./taskcard.scss'],
})
export class TaskcardComponent {
  private userService = inject(UserService);

  // Receives the task data from the parent list
  @Input() task!: TaskDTO;

  // Emits an event to the parent when the checkmark is clicked
  @Output() toggleStatus = new EventEmitter<TaskDTO>();

  onCheckmarkClick() {
    this.toggleStatus.emit(this.task);
  }

  getImageUrl(id: number | undefined): string | null {
    if (!id) return null;
    return this.userService.getImageUrl(id);
  }
}
