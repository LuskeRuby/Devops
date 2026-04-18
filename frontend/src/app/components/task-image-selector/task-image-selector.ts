import { Component, OnInit, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-task-image-selector',
  standalone: true,
  imports: [MatDialogModule],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2>Vælg et billede</h2>
        <button class="close-btn" (click)="selectImage(null)">X</button>
      </div>

      <div class="dialog-content">
        @if (loading()) {
          <div class="loader">
            <p>Henter billeder...</p>
          </div>
        } @else {
          <div class="image-grid">
            @for (id of imageIds(); track id) {
              <div 
                class="image-item" 
                [class.selected]="id === selectedId()"
                (click)="selectImage(id)"
              >
                <img [src]="getImageUrl(id)" alt="Task Image" />
              </div>
            } @empty {
              <div class="loader">
                <p>Ingen billeder fundet</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './task-image-selector.scss',
})
export class TaskImageSelectorComponent implements OnInit {
  private userService = inject(UserService);
  private dialogRef = inject(MatDialogRef<TaskImageSelectorComponent>);

  imageIds = signal<number[]>([]);
  loading = signal<boolean>(true);
  selectedId = signal<number | null>(null);

  ngOnInit(): void {
    this.userService.getImagesByType('TASK').subscribe({
      next: (results) => {
        this.imageIds.set(results);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  selectImage(id: number | null): void {
    this.selectedId.set(id);
    this.dialogRef.close(id);
  }

  getImageUrl(id: number): string {
    return this.userService.getImageUrl(id);
  }
}
