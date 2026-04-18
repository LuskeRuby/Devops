import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';

import { PointsInputComponent } from '../points-input/points-input';
import { TaskImageSelectorComponent } from '../task-image-selector/task-image-selector';

interface CalendarEventDialogData {
  title?: string;
  description?: string;
  start: Date;
  end: Date;
  selectedUserIds?: number[];
  eventId?: number;
  users?: { id: number; name: string }[];
  points?: number;
  imageId?: number;
  isReadOnly?: boolean;
}

export interface CalendarEventDialogResult {
  mode: 'save' | 'update' | 'delete';
  eventId?: number;
  isSeparateTasks: boolean;
  title: string;
  description: string;
  start: Date;
  end: Date;
  userIds: number[];
  points: number;
  imageId?: number;
}

@Component({
  selector: 'app-calendar-event-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    PointsInputComponent,
  ],
  templateUrl: './calendar-event-dialog.html',
  styleUrl: './calendar-event-dialog.scss',
})
export class CalendarEventDialogComponent implements OnInit {
  dialogRef = inject<MatDialogRef<CalendarEventDialogComponent>>(MatDialogRef);
  data = inject<CalendarEventDialogData>(MAT_DIALOG_DATA);
  dialog = inject(MatDialog);
  userService = inject(UserService);
  private cd = inject(ChangeDetectorRef);

  title = '';
  description = '';
  startLocal = '';
  endLocal = '';
  selectedUserIds: number[] = [];
  isSeparateTasks = false;
  points = 0;
  imageId: number | null = null;
  isReadOnly = false;

  constructor() {}

  ngOnInit(): void {
    this.initFromData();
    this.cd.detectChanges();
  }

  private initFromData(): void {
    this.title = this.data.title ?? '';
    this.description = this.data.description ?? '';
    this.startLocal = this.toLocalInput(this.data.start);
    this.endLocal = this.toLocalInput(this.data.end);
    this.selectedUserIds = [...(this.data.selectedUserIds ?? [])];
    this.points = this.data.points ?? 0;
    const rawImageId = this.data.imageId;
    this.imageId = rawImageId && rawImageId > 0 ? rawImageId : null;
    this.isReadOnly = !!this.data.isReadOnly;
  }

  toggleUser(userId: number): void {
    this.selectedUserIds = this.selectedUserIds.includes(userId)
      ? this.selectedUserIds.filter((id) => id !== userId)
      : [...this.selectedUserIds, userId];
  }

  canSave(): boolean {
    if (this.title.trim().length === 0) return false;
    if (this.selectedUserIds.length === 0) return false;
    const start = new Date(this.startLocal);
    const end = new Date(this.endLocal);
    return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start;
  }

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
      points: this.points,
      imageId: this.imageId ?? undefined,
    };
    this.dialogRef.close(result);
  }

  close(): void {
    this.dialogRef.close();
  }

  delete(): void {
    const result: CalendarEventDialogResult = {
      mode: 'delete',
      eventId: this.data.eventId,
      isSeparateTasks: this.isSeparateTasks,
      title: this.title.trim(),
      description: this.description.trim(),
      start: new Date(this.startLocal),
      end: new Date(this.endLocal),
      userIds: this.selectedUserIds,
      points: this.points,
      imageId: this.imageId ?? undefined,
    };
    this.dialogRef.close(result);
  }

  private toLocalInput(date: Date): string {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  openImageSelector(): void {
    const dialogRef = this.dialog.open(TaskImageSelectorComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((selectedId: number | undefined) => {
      if (selectedId !== undefined) {
        setTimeout(() => {
          this.imageId = selectedId;
          this.cd.detectChanges();
        });
      }
    });
  }

  getImageUrl(id: number | null): string | null {
    if (!id) return null;
    return this.userService.getImageUrl(id);
  }
}
