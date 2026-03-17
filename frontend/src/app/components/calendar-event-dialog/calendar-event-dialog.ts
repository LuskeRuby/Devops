import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';

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

      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Beskrivelse</mat-label>
        <textarea matInput [(ngModel)]="description"></textarea>
      </mat-form-field>

      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Sted</mat-label>
        <input matInput [(ngModel)]="location">
      </mat-form-field>

      <div style="margin-top:10px">
        <label>Billede</label>
        <input type="file" (change)="onFileSelected($event)">
      </div>

      <img *ngIf="imagePreview"
           [src]="imagePreview"
           style="margin-top:10px;max-width:100%;border-radius:6px">

    </div>
  `
})
export class CalendarEventDialogComponent {
  title = '';
  description = '';
  location = '';

  imagePreview: string | null = null;
  imageFile: File | null = null;

  constructor(
    public dialogRef: MatDialogRef<CalendarEventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private router: Router
  ) {
    if (data) {
      this.title = data.title || '';
      this.description = data.description || '';
      this.location = data.location || '';
      this.imagePreview = data.image || null;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.imageFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  close() {
    this.dialogRef.close();
  }

  save() {
    const eventData = {
      title: this.title,
      description: this.description,
      location: this.location,
      image: this.imagePreview
    };

    this.dialogRef.close(eventData);
  }

  goToTaskPage() {

    // luk dialog
    this.dialogRef.close();

    // send titel til task form
    this.router.navigate(['/task'], {
      queryParams: {
        title: this.title
      }
    });
  }

}
