import { Component, OnInit, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { LucideAngularModule, LucideIconData } from "lucide-angular";

@Component({
  selector: 'app-task-image-selector',
  standalone: true,
  imports: [MatDialogModule, LucideAngularModule],
  templateUrl: './task-image-selector.html',
  styleUrl: './task-image-selector.scss',
})
export class TaskImageSelectorComponent implements OnInit {
  private userService = inject(UserService);
  private dialogRef = inject(MatDialogRef<TaskImageSelectorComponent>);

  imageIds = signal<number[]>([]);
  loading = signal<boolean>(true);
  selectedId = signal<number | null>(null);
  CloseIcon: string|LucideIconData|undefined;

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
