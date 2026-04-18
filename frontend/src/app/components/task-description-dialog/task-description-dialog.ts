import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface TaskDescriptionData {
  title: string;
  description: string;
  points: number;
  assignedUserNames: string[];
}

@Component({
  selector: 'app-task-description-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './task-description-dialog.html',
  styleUrls: ['./task-description-dialog.scss']
})
export class TaskDescriptionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<TaskDescriptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskDescriptionData
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
  }
}
