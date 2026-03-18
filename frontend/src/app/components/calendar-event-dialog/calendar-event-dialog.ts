import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

interface FamilyUserOption {
  id: number;
  name: string;
}

export interface CalendarEventDialogData {
  title?: string;
  description?: string;
  start: Date;
  end: Date;
  users: FamilyUserOption[];
  selectedUserIds?: number[];
  eventId?: number;
}

export type CalendarEventDialogResult =
  | {
      mode: 'save';
      title: string;
      description: string;
      start: Date;
      end: Date;
      userIds: number[];
    }
  | {
      mode: 'edit';
      eventId?: number;
      title: string;
    };

@Component({
  selector: 'app-calendar-event-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.eventId ? 'Event' : 'Create event' }}</h2>

    <div mat-dialog-content>
      <label>Title</label>
      <input [(ngModel)]="title" class="field" />

      <label>Description</label>
      <textarea [(ngModel)]="description" rows="3" class="field"></textarea>

      <label>Start</label>
      <input type="datetime-local" [(ngModel)]="startLocal" class="field" />

      <label>End</label>
      <input type="datetime-local" [(ngModel)]="endLocal" class="field" />

      <label>Assign family members</label>
      <div class="users">
        <label *ngFor="let user of data.users" class="user-row">
          <input
            type="checkbox"
            [checked]="selectedUserIds.includes(user.id)"
            (change)="toggleUser(user.id)"
          />
          {{ user.name }}
        </label>
      </div>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cancel</button>
      <button mat-button color="primary" (click)="edit()">Edit</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="!canSave()">Save</button>
    </div>
  `,
  styles: [
    `
      .field {
        width: 100%;
        margin: 6px 0 12px;
      }

      .users {
        max-height: 160px;
        overflow: auto;
        margin-top: 6px;
      }

      .user-row {
        display: block;
        margin: 4px 0;
      }
    `
  ]
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
    this.title = data.title ?? '';
    this.description = data.description ?? '';
    this.startLocal = this.toLocalInput(data.start);
    this.endLocal = this.toLocalInput(data.end);
    this.selectedUserIds = data.selectedUserIds ? [...data.selectedUserIds] : [];
  }

  toggleUser(userId: number): void {
    if (this.selectedUserIds.includes(userId)) {
      this.selectedUserIds = this.selectedUserIds.filter(id => id !== userId);
      return;
    }

    this.selectedUserIds = [...this.selectedUserIds, userId];
  }

  canSave(): boolean {
    return this.title.trim().length > 0 && this.selectedUserIds.length > 0;
  }

  save(): void {
    const result: CalendarEventDialogResult = {
      mode: 'save',
      title: this.title.trim(),
      description: this.description.trim(),
      start: new Date(this.startLocal),
      end: new Date(this.endLocal),
      userIds: this.selectedUserIds
    };

    this.dialogRef.close(result);
  }

  edit(): void {
    const result: CalendarEventDialogResult = {
      mode: 'edit',
      eventId: this.data.eventId,
      title: this.title.trim()
    };

    this.dialogRef.close(result);
  }

  close(): void {
    this.dialogRef.close();
  }

  private toLocalInput(date: Date): string {
    const copy = new Date(date);
    copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
    return copy.toISOString().slice(0, 16);
  }
}
