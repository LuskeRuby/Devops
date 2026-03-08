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
    <h2 mat-dialog-title>Opret Event</h2>

    <div mat-dialog-content>
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Titel</mat-label>
        <input matInput [(ngModel)]="title">
      </mat-form-field>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="close()">Annuller</button>
      <button mat-raised-button color="primary" (click)="save()">Gem</button>
    </div>
  `
})
export class CalendarEventDialogComponent {
  title = '';

  constructor(
    public dialogRef: MatDialogRef<CalendarEventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  close() {
    this.dialogRef.close();
  }

  save() {
    this.dialogRef.close(this.title);
  }
}
