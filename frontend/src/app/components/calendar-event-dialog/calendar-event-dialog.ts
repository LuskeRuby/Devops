import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

interface CalendarEventDialogData {
  title?: string;
  description?: string;
  start: Date;
  end: Date;
  selectedUserIds?: number[];
  eventId?: number;
  users?: { id: number; name: string }[];
}

export type CalendarEventDialogResult = {
  mode: 'save' | 'update';
  eventId?: number;
  title: string;
  description: string;
  start: Date;
  end: Date;
  userIds: number[];
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
    MatInputModule
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
      title: this.title.trim(),
      description: this.description.trim(),
      start: new Date(this.startLocal),
      end: new Date(this.endLocal),
      userIds: this.selectedUserIds
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
