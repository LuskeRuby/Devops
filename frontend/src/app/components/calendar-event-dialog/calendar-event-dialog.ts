import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';

import { PointsInputComponent } from '../points-input/points-input';

interface CalendarEventDialogData {
  title?: string;
  description?: string;
  start: Date;
  end: Date;
  selectedUserIds?: number[];
  eventId?: number;
  users?: { id: number; name: string }[];
  points?: number;
  isReadOnly?: boolean;
}

export type CalendarEventDialogResult = {
  mode: 'save' | 'update';
  eventId?: number;
  isSeparateTasks: boolean;
  title: string;
  description: string;
  start: Date;
  end: Date;
  userIds: number[];
  points: number;
};

@Component({
  selector: 'app-calendar-event-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    PointsInputComponent
  ],
  templateUrl: './calendar-event-dialog.html',
  styleUrl: './calendar-event-dialog.scss'
})
export class CalendarEventDialogComponent {
  title = '';
  description = '';
  startLocal = '';
  endLocal = '';
  selectedUserIds: number[] = [];
  isSeparateTasks = false;
  points = 0;
  isReadOnly = false;

  constructor(
    public dialogRef: MatDialogRef<CalendarEventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CalendarEventDialogData
  ) {
    this.initFromData();
  }

  // ---------------- INIT ----------------

  private initFromData(): void {
    this.title = this.data.title ?? '';
    this.description = this.data.description ?? '';
    this.startLocal = this.toLocalInput(this.data.start);
    this.endLocal = this.toLocalInput(this.data.end);
    this.selectedUserIds = [...(this.data.selectedUserIds ?? [])];
    this.points = this.data.points ?? 0;
    this.isReadOnly = !!this.data.isReadOnly;
  }

  // ---------------- USERS ----------------

  toggleUser(userId: number): void {
    this.selectedUserIds = this.selectedUserIds.includes(userId)
      ? this.selectedUserIds.filter(id => id !== userId)
      : [...this.selectedUserIds, userId];
  }

  // ---------------- VALIDATION ----------------

  canSave(): boolean {
    if (this.title.trim().length === 0) return false;
    if (this.selectedUserIds.length === 0) return false;

    const start = new Date(this.startLocal);
    const end = new Date(this.endLocal);

    return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start;
  }

  // ---------------- SAVE ----------------

  save(): void {
    if (!this.canSave()) return;

    const result: CalendarEventDialogResult = {
      mode: this.data.eventId ? 'update' : 'save',
      eventId: this.data.eventId,
      isSeparateTasks: this.isSeparateTasks,
      title: this.title.trim(),
      description: this.description.trim(),
      start: new Date(this.startLocal),
      end: new Date(this.endLocal),
      userIds: this.selectedUserIds,
      points: this.points
    };

    this.dialogRef.close(result);
  }


  close(): void {
    this.dialogRef.close();
  }

  // ---------------- HELPERS ----------------

  private toLocalInput(date: Date): string {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }
}
