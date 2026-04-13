import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-error-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="error-banner" role="alert">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {{ message() }}
    </div>
  `,
  styles: [
    `
      .error-banner {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #fdf3f2;
        color: #c0392b;
        border: 1px solid #f0c0bc;
        border-radius: 8px;
        padding: 0.65rem 0.875rem;
        font-size: 0.875rem;
        margin-bottom: 1.25rem;
      }
    `,
  ],
})
export class ErrorBannerComponent {
  message = input.required<string>();
}
