import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-calendar-event-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEditing ? 'Event detaljer' : 'Opret Event' }}</h2>

    <div mat-dialog-content>

      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Titel</mat-label>
        <input matInput [(ngModel)]="title">
      </mat-form-field>

      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Beskrivelse</mat-label>
        <textarea matInput [(ngModel)]="description" rows="3"></textarea>
      </mat-form-field>

    </div>

    <div mat-dialog-actions style="justify-content: space-between">

      <button mat-button color="warn" *ngIf="isEditing" (click)="delete()">
        Slet
      </button>

      <div style="display:flex; gap:8px; margin-left:auto">
        <button mat-button (click)="close()">Annuller</button>
        <button mat-raised-button color="primary" *ngIf="!isEditing" (click)="save()" [disabled]="!title.trim()">
          Gem
        </button>
      </div>

    </div>
  `
})
export class CalendarEventDialogComponent {

  title = '';
  description = '';
  isEditing = false;

  constructor(
    public dialogRef: MatDialogRef<CalendarEventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data) {
      this.title = data.title || '';
      this.description = data.description || '';
      this.isEditing = !!data.id;
    }
  }

  close() {
    this.dialogRef.close();
  }

  save() {
    this.dialogRef.close({
      title: this.title.trim(),
      description: this.description.trim()
    });
  }

  delete() {
    this.dialogRef.close({ deleted: true });
  }
}
