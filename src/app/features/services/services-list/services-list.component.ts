// src/app/features/services/services-list/services-list.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Service } from '../../../core/models/interfaces';

@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [
    CommonModule, // ✅ Added CommonModule
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="services-container">
      <!-- Loading State -->
      @if (loading) {
        <div class="loading-state">
          <div class="loading-animation">
            <div class="loading-circle"></div>
            <div class="loading-circle"></div>
            <div class="loading-circle"></div>
          </div>
          <h3 class="loading-title">Loading Services</h3>
          <p class="loading-subtitle">Please wait while we fetch available services...</p>
        </div>
      }

      <!-- Error State -->
      @if (error && !loading) {
        <div class="error-state">
          <div class="error-illustration">
            <mat-icon class="error-icon">cloud_off</mat-icon>
          </div>
          <h3 class="error-title">Connection Problem</h3>
          <p class="error-message">{{ error }}</p>
          <button mat-raised-button
                  class="retry-button"
                  (click)="onRefresh.emit()">
            <mat-icon>refresh</mat-icon>
            Try Again
          </button>
        </div>
      }

      <!-- Services Grid -->
      @if (!loading && !error && services.length > 0) {
        <div class="services-grid">
          @for (service of services; track trackByServiceId($index, service)) {
            <div class="service-card"
                 [class.active]="service.active_ind"
                 [class.inactive]="!service.active_ind"
                 (click)="selectService(service)"
                 [tabindex]="service.active_ind ? 0 : -1"
                 role="button"
                 [attr.aria-label]="'Service: ' + service.name + (service.active_ind ? ' - Click to start application' : ' - Currently unavailable')">

              <!-- Card Header with Icon -->
              <div class="card-header">
                <div class="icon-wrapper">
                  @if (service.icon) {
                    <img [src]="service.icon"
                         [alt]="service.name + ' icon'"
                         class="service-icon"
                         (error)="onImageError($event)">
                  } @else {
                    <div class="icon-placeholder">
                      <mat-icon class="default-icon">{{ getServiceIcon(service) }}</mat-icon>
                    </div>
                  }
                </div>

                <!-- Quick Status Indicator -->
                <div class="status-indicator"
                     [class.active]="service.active_ind"
                     [matTooltip]="service.active_ind ? 'Service Available' : 'Service Unavailable'">
                  <span class="status-dot"></span>
                </div>
              </div>

              <!-- Card Body -->
              <div class="card-body">
                <h3 class="service-name">{{ service.name }}</h3>
                @if (service.name_ara) {
                  <p class="service-name-arabic">{{ service.name_ara }}</p>
                }

                <!-- Simplified Info -->
                <div class="service-meta">
                  <span class="meta-item">
                    <mat-icon class="meta-icon">qr_code_2</mat-icon>
                    {{ service.code }}
                  </span>
                  <span class="meta-divider">•</span>
                  <span class="meta-item">
                    <mat-icon class="meta-icon">category</mat-icon>
                    {{ service.type || 'General' }}
                  </span>
                </div>
              </div>

              <!-- Card Footer -->
              <div class="card-footer">
                @if (service.active_ind) {
                  <button mat-flat-button
                          class="action-button primary"
                          (click)="onStart.emit(service); $event.stopPropagation()">
                    <mat-icon>rocket_launch</mat-icon>
                    Start Application
                  </button>
                } @else {
                  <div class="unavailable-notice">
                    <mat-icon class="notice-icon">info</mat-icon>
                    <span>Currently Unavailable</span>
                  </div>
                }
              </div>

              <!-- Hover Effect -->
              @if (service.active_ind) {
                <div class="hover-effect"></div>
              }
            </div>
          }
        </div>
      }

      <!-- Empty State -->
      @if (!loading && !error && services.length === 0) {
        <div class="empty-state">
          <div class="empty-illustration">
            <mat-icon class="empty-icon">inbox</mat-icon>
          </div>
          <h3 class="empty-title">No Services Found</h3>
          <p class="empty-message">
            There are no services available at the moment.<br>
            Please check back later or contact support.
          </p>
          <button mat-stroked-button
                  class="refresh-button"
                  (click)="onRefresh.emit()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .services-container {
      width: 100%;
      min-height: 500px;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 500px;
      gap: 24px;
    }

    .loading-animation {
      display: flex;
      gap: 12px;
    }

    .loading-circle {
      width: 12px;
      height: 12px;
      background: #2EC4B6;
      border-radius: 50%;
      animation: loadingPulse 1.4s ease-in-out infinite;
    }

    .loading-circle:nth-child(1) { animation-delay: -0.32s; }
    .loading-circle:nth-child(2) { animation-delay: -0.16s; }

    @keyframes loadingPulse {
      0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }

    .loading-title {
      font-size: 24px;
      font-weight: 600;
      color: #2c3e50;
      margin: 0;
    }

    .loading-subtitle {
      font-size: 16px;
      color: #7f8c8d;
      margin: 0;
    }

    /* Error State */
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 500px;
      text-align: center;
      padding: 40px;
    }

    .error-illustration {
      width: 120px;
      height: 120px;
      background: rgba(231, 76, 60, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 32px;
    }

    .error-icon {
      font-size: 64px;
      color: #e74c3c;
    }

    .error-title {
      font-size: 28px;
      font-weight: 600;
      color: #2c3e50;
      margin: 0 0 12px 0;
    }

    .error-message {
      font-size: 16px;
      color: #7f8c8d;
      margin: 0 0 32px 0;
      max-width: 400px;
      line-height: 1.6;
    }

    .retry-button {
      background: linear-gradient(135deg, #2EC4B6 0%, #2BA99B 100%);
      color: white;
      font-weight: 600;
      padding: 0 32px;
      height: 48px;
      border-radius: 24px;
      font-size: 16px;
    }

    .retry-button mat-icon {
      margin-right: 8px;
    }

    /* Services Grid */
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 24px;
    }

    /* Service Card */
    .service-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      position: relative;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 280px;
    }

    .service-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
    }

    .service-card.active:hover .hover-effect {
      opacity: 1;
    }

    .service-card.inactive {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .service-card.inactive:hover {
      transform: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    /* Card Header */
    .card-header {
      position: relative;
      height: 100px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .icon-wrapper {
      position: relative;
      z-index: 1;
    }

    .service-icon {
      width: 48px;
      height: 48px;
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }

    .icon-placeholder {
      width: 64px;
      height: 64px;
      background: rgba(46, 196, 182, 0.1);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .default-icon {
      font-size: 32px;
      color: #2EC4B6;
    }

    /* Status Indicator */
    .status-indicator {
      position: absolute;
      top: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #e74c3c;
      animation: statusPulse 2s ease-in-out infinite;
    }

    .status-indicator.active .status-dot {
      background: #27ae60;
    }

    @keyframes statusPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    /* Card Body */
    .card-body {
      flex: 1;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .service-name {
      font-size: 20px;
      font-weight: 600;
      color: #2c3e50;
      margin: 0;
      line-height: 1.3;
    }

    .service-name-arabic {
      font-size: 16px;
      color: #7f8c8d;
      margin: 0;
      line-height: 1.4;
    }

    .service-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: auto;
      color: #95a5a6;
      font-size: 14px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .meta-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .meta-divider {
      color: #cbd5e0;
    }

    /* Card Footer */
    .card-footer {
      padding: 20px 24px;
      background: #fafbfc;
      border-top: 1px solid #e9ecef;
    }

    .action-button {
      width: 100%;
      height: 44px;
      border-radius: 22px;
      font-weight: 600;
      font-size: 15px;
      letter-spacing: 0.3px;
      transition: all 0.2s ease;
    }

    .action-button.primary {
      background: linear-gradient(135deg, #2EC4B6 0%, #2BA99B 100%);
      color: white;
    }

    .action-button.primary:hover {
      background: linear-gradient(135deg, #2BA99B 0%, #2EC4B6 100%);
      box-shadow: 0 4px 12px rgba(46, 196, 182, 0.3);
    }

    .action-button mat-icon {
      margin-right: 8px;
      font-size: 20px;
    }

    .unavailable-notice {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #7f8c8d;
      font-size: 14px;
      font-weight: 500;
      padding: 12px;
    }

    .notice-icon {
      font-size: 18px;
      color: #95a5a6;
    }

    /* Hover Effect */
    .hover-effect {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(46, 196, 182, 0.05) 0%, rgba(43, 169, 155, 0.05) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 500px;
      text-align: center;
      padding: 40px;
    }

    .empty-illustration {
      width: 120px;
      height: 120px;
      background: rgba(189, 195, 199, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 32px;
    }

    .empty-icon {
      font-size: 64px;
      color: #bdc3c7;
    }

    .empty-title {
      font-size: 28px;
      font-weight: 600;
      color: #2c3e50;
      margin: 0 0 12px 0;
    }

    .empty-message {
      font-size: 16px;
      color: #7f8c8d;
      margin: 0 0 32px 0;
      line-height: 1.6;
    }

    .refresh-button {
      border: 2px solid #e9ecef;
      color: #2c3e50;
      font-weight: 600;
      padding: 0 32px;
      height: 48px;
      border-radius: 24px;
      font-size: 16px;
      transition: all 0.2s ease;
    }

    .refresh-button:hover {
      border-color: #2EC4B6;
      color: #2EC4B6;
      background: rgba(46, 196, 182, 0.05);
    }

    .refresh-button mat-icon {
      margin-right: 8px;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .services-grid {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
      }
    }

    @media (max-width: 768px) {
      .services-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .service-card {
        min-height: 240px;
      }

      .card-header {
        height: 80px;
      }

      .service-name {
        font-size: 18px;
      }

      .loading-title,
      .error-title,
      .empty-title {
        font-size: 24px;
      }
    }

    @media (max-width: 480px) {
      .error-state,
      .empty-state {
        padding: 24px;
      }

      .card-body {
        padding: 20px;
      }

      .card-footer {
        padding: 16px 20px;
      }

      .action-button {
        font-size: 14px;
        height: 40px;
      }
    }

    /* Focus States for Accessibility */
    .service-card:focus {
      outline: 2px solid #2EC4B6;
      outline-offset: 2px;
    }

    .service-card:focus:not(:focus-visible) {
      outline: none;
    }

    /* Dark Mode Support */
    @media (prefers-color-scheme: dark) {
      .service-card {
        background: #1a1a1a;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }

      .card-header {
        background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
      }

      .card-footer {
        background: #242424;
        border-top-color: #333;
      }

      .service-name {
        color: #f8f9fa;
      }

      .service-name-arabic,
      .service-meta {
        color: #a0a0a0;
      }

      .status-indicator {
        background: #2a2a2a;
      }

      .icon-placeholder {
        background: rgba(46, 196, 182, 0.2);
      }
    }
  `]
})
export class ServicesListComponent {
  @Input() services: Service[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;

  @Output() onStart = new EventEmitter<Service>();
  @Output() onPreview = new EventEmitter<Service>();
  @Output() onRefresh = new EventEmitter<void>();

  trackByServiceId(index: number, service: Service): number {
    return service.id;
  }

  selectService(service: Service): void {
    if (service.active_ind) {
      this.onStart.emit(service);
    }
  }

  onImageError(event: any): void {
    // Hide the broken image and show default icon
    event.target.style.display = 'none';
  }

  getServiceIcon(service: Service): string {
    // Map service types to appropriate icons
    const iconMap: { [key: string]: string } = {
      // Documents & Permits
      'permit': 'description',
      'license': 'card_membership',
      'certificate': 'verified_user',
      'document': 'article',
      'form': 'assignment',
      'contract': 'gavel',
      'agreement': 'handshake',
      'report': 'assessment',
      'statement': 'receipt_long',

      // Applications & Requests
      'application': 'assignment_turned_in',
      'request': 'request_quote',
      'submission': 'publish',
      'registration': 'how_to_reg',
      'enrollment': 'person_add',
      'booking': 'event_available',
      'reservation': 'event_seat',
      'appointment': 'calendar_today',

      // Approvals & Processing
      'approval': 'task_alt',
      'review': 'rate_review',
      'verification': 'verified',
      'validation': 'fact_check',
      'authorization': 'security',
      'clearance': 'check_circle',
      'endorsement': 'thumb_up',

      // Financial
      'payment': 'payment',
      'invoice': 'receipt',
      'billing': 'point_of_sale',
      'refund': 'currency_exchange',
      'fee': 'attach_money',
      'tax': 'account_balance',
      'finance': 'account_balance_wallet',
      'transaction': 'paid',

      // Identity & Access
      'identification': 'badge',
      'passport': 'contact_page',
      'visa': 'flight_takeoff',
      'residence': 'home',
      'citizenship': 'public',
      'identity': 'fingerprint',

      // Business & Commerce
      'business': 'business',
      'company': 'corporate_fare',
      'trade': 'storefront',
      'commerce': 'shopping_cart',
      'vendor': 'store',
      'supplier': 'local_shipping',
      'partnership': 'groups',

      // Property & Real Estate
      'property': 'real_estate_agent',
      'land': 'terrain',
      'building': 'apartment',
      'construction': 'construction',
      'housing': 'house',
      'lease': 'key',
      'mortgage': 'home_work',

      // Healthcare & Medical
      'health': 'health_and_safety',
      'medical': 'medical_services',
      'prescription': 'medication',
      'insurance': 'shield',
      'vaccination': 'vaccines',
      'treatment': 'healing',
      'emergency': 'emergency',

      // Education & Training
      'education': 'school',
      'training': 'model_training',
      'course': 'menu_book',
      'certification': 'workspace_premium',
      'degree': 'school',
      'scholarship': 'savings',
      'exam': 'quiz',

      // Legal & Compliance
      'legal': 'gavel',
      'court': 'account_balance',
      'lawsuit': 'policy',
      'compliance': 'rule',
      'regulation': 'rule_folder',
      'law': 'book',
      'justice': 'balance',

      // Transportation & Vehicles
      'vehicle': 'directions_car',
      'transportation': 'commute',
      'driving': 'drive_eta',
      'parking': 'local_parking',
      'traffic': 'traffic',
      'transit': 'directions_transit',
      'shipping': 'local_shipping',

      // Communication & Services
      'communication': 'forum',
      'notification': 'notifications',
      'announcement': 'campaign',
      'broadcast': 'cell_tower',
      'mail': 'mail',
      'email': 'email',
      'message': 'message',

      // Technology & Digital
      'digital': 'computer',
      'online': 'language',
      'software': 'apps',
      'system': 'settings_applications',
      'database': 'storage',
      'network': 'hub',
      'security': 'security',

      // Environment & Agriculture
      'environment': 'eco',
      'agriculture': 'agriculture',
      'farming': 'grass',
      'water': 'water_drop',
      'energy': 'bolt',
      'renewable': 'wind_power',
      'waste': 'delete',

      // Employment & HR
      'employment': 'work',
      'job': 'work_outline',
      'career': 'trending_up',
      'recruitment': 'person_search',
      'hr': 'groups',
      'payroll': 'payments',
      'benefits': 'card_giftcard',

      // General & Miscellaneous
      'general': 'build',
      'service': 'room_service',
      'support': 'support_agent',
      'help': 'help',
      'info': 'info',
      'other': 'more_horiz',
      'custom': 'tune',
      'special': 'star',
      'priority': 'priority_high',
      'urgent': 'notification_important',
      'standard': 'check_box',
      'basic': 'radio_button_checked'
    };

    // Convert number to string and handle the type
    const typeStr = service.type?.toString() || 'general';

    // You might want to map specific type numbers to categories
    // For example: 1 = permit, 2 = license, etc.
    const typeMapping: { [key: string]: string } = {
      '1': 'permit',
      '2': 'license',
      '3': 'certificate',
      '4': 'registration',
      '5': 'payment',
      '6': 'request',
      '7': 'approval',
      '8': 'application'
    };

    const mappedType = typeMapping[typeStr] || 'general';
    return iconMap[mappedType] || iconMap['general'];
  }
}
