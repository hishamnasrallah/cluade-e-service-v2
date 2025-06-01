// src/app/shared/components/error-message/error-message.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="error-message" *ngIf="message">
      <mat-icon class="error-icon">error</mat-icon>
      <span class="error-text">{{ message }}</span>
    </div>
  `,
  styles: [`
    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #ffebee;
      border-left: 4px solid #f44336;
      border-radius: 4px;
      color: #c62828;
      font-size: 14px;
      margin: 8px 0;
    }

    .error-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #f44336;
    }

    .error-text {
      flex: 1;
    }
  `]
})
export class ErrorMessageComponent {
  @Input() message: string = '';
}
