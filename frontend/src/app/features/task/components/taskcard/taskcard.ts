import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TaskDTO } from '../../models/TaskDto';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-taskcard',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './taskcard.html',
  styleUrls: ['./taskcard.scss'],
})
export class TaskcardComponent {
  // Receives the task data from the parent list
  @Input() task!: TaskDTO;

  // Emits an event to the parent when the checkmark is clicked
  @Output() toggleStatus = new EventEmitter<TaskDTO>();

  onCheckmarkClick() {
    this.toggleStatus.emit(this.task);
  }
}
