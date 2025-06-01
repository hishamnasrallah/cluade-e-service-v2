// src/app/shared/components/loading/loading.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-container">
      <mat-spinner [diameter]="diameter" [color]="color"></mat-spinner>
      <p class="loading-text" *ngIf="message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      gap: 16px;
    }

    .loading-text {
      margin: 0;
      color: #666;
      font-size: 14px;
      text-align: center;
    }
  `]
})
export class LoadingComponent {
  @Input() diameter: number = 40;
  @Input() color: string = 'primary';
  @Input() message: string = '';
}
