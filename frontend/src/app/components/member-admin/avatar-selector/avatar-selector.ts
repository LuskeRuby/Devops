import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../../services/user.service';
import { LucideAngularModule, X } from 'lucide-angular';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-avatar-selector',
  standalone: true,
  imports: [CommonModule, MatDialogModule, LucideAngularModule],
  templateUrl: './avatar-selector.html',
  styleUrl: './avatar-selector.scss'
})
export class AvatarSelectorComponent implements OnInit {
  private userService = inject(UserService);
  private dialogRef = inject(MatDialogRef<AvatarSelectorComponent>);
  
  readonly CloseIcon = X;
  
  avatarIds = signal<number[]>([]);
  loading = signal<boolean>(true);
  selectedId = signal<number | null>(null);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { memberRole: string }) {}

  ngOnInit(): void {
    const categories = this.data.memberRole.toLowerCase() === 'parent' 
      ? ['gents', 'women'] 
      : ['boys', 'girls'];

    forkJoin(categories.map(cat => this.userService.getAvatarsByCategory(cat)))
      .subscribe({
        next: (results) => {
          this.avatarIds.set(results.flat());
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  selectAvatar(id: number): void {
    this.selectedId.set(id);
    this.dialogRef.close(id);
  }

  getImageUrl(id: number): string {
    return this.userService.getImageUrl(id);
  }
}
