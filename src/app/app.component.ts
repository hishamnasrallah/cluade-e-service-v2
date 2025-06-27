// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from './core/services/auth.service';
import { ConfigService } from './core/services/config.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule
  ],
  template: `
    <div class="app-container">
      <mat-toolbar color="primary" class="app-toolbar">
        <span class="toolbar-title">
          <mat-icon class="app-icon">apps</mat-icon>
            <svg width="230" height="80" viewBox="0 0 230 80" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#34C5AA;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#2BA99B;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#5FD3C4;stop-opacity:1" />
    </linearGradient>

    <!-- Shadow filter definition -->
    <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
      <feOffset dx="2" dy="2" result="offsetblur"/>
      <feFlood flood-color="#000000" flood-opacity="0.2"/>
      <feComposite in2="offsetblur" operator="in"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

              <!-- Apply filter to the main group -->
  <g filter="url(#dropShadow)">
    <g transform="translate(0, 5) scale(0.8)">
      <path d="M 15 10 L 15 70 L 25 70 L 25 45 L 40 45 Q 55 45 55 30 Q 55 15 40 15 L 25 15 L 25 35 L 40 35 Q 45 35 45 30 Q 45 25 40 25 L 25 25" fill="url(#grad1)" />
      <rect x="30" y="20" width="8" height="3" fill="#2F4858" opacity="0.3" />
      <rect x="30" y="26" width="12" height="3" fill="#2F4858" opacity="0.3" />
      <rect x="30" y="32" width="6" height="3" fill="#2F4858" opacity="0.3" />
    </g>
    <text x="44" y="52" font-family="Rajdhani, sans-serif" font-size="48" font-weight="600" fill="url(#grad1)">ra</text>
    <g transform="translate(84, 5) scale(0.8)">
      <path d="M 15 15 L 30 30 L 30 35 L 35 35 L 35 30 L 50 15 L 65 15 L 50 30 L 50 35 L 45 35 L 45 30 L 30 45 L 45 60 L 45 50 L 50 50 L 50 45 L 65 60 L 65 65 L 50 65 L 35 50 L 35 45 L 30 45 L 30 50 L 15 65 L 15 60 L 30 45 L 15 30 L 15 15 Z" fill="url(#grad1)" />
      <rect x="36" y="33" width="8" height="3" fill="#2F4858" opacity="0.3" />
      <rect x="33" y="37" width="14" height="3" fill="#2F4858" opacity="0.3" />
      <rect x="36" y="41" width="8" height="3" fill="#2F4858" opacity="0.3" />
      <rect x="55" y="38" width="18" height="2" fill="#5FD3C4" opacity="0.6" />
      <rect x="58" y="42" width="15" height="2" fill="#5FD3C4" opacity="0.4" />
      <rect x="60" y="46" width="10" height="2" fill="#5FD3C4" opacity="0.2" />
    </g>
    <text x="144" y="52" font-family="Rajdhani, sans-serif" font-size="48" font-weight="600" fill="url(#grad1)">elo</text>
  </g>
</svg>

        </span>

        <span class="spacer"></span>

        <!-- Navigation buttons when authenticated -->
        <div class="nav-buttons" *ngIf="isAuthenticated">
          <button mat-button
                  [class.active]="isActiveRoute('/home')"
                  (click)="navigateTo('/home')">
            <mat-icon>home</mat-icon>
            My Applications
          </button>

          <button mat-button
                  [class.active]="isActiveRoute('/services')"
                  (click)="navigateTo('/services')">
            <mat-icon>miscellaneous_services</mat-icon>
            Services
          </button>
        </div>

        <!-- User menu -->
        <div class="user-menu" *ngIf="isAuthenticated">
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>

          <mat-menu #userMenu="matMenu">
            <button mat-menu-item (click)="goToConfig()">
              <mat-icon>settings</mat-icon>
              <span>Configuration</span>
            </button>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Logout</span>
            </button>
          </mat-menu>
        </div>

        <!-- Config button when not authenticated -->
        <button mat-icon-button
                *ngIf="!isAuthenticated && showConfigButton"
                (click)="goToConfig()"
                matTooltip="Configuration">
          <mat-icon>settings</mat-icon>
        </button>
      </mat-toolbar>

      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .app-toolbar {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      background: linear-gradient(135deg, #27b0a3 0%, #299786 100%)
    }

    .toolbar-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 500;
    }

    .app-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .app-name {
      font-size: 22px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }

    .app-logo {
      height: 32px;
      width: auto;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .nav-buttons {
      display: flex;
      gap: 8px;
      margin-right: 16px;
    }

    .nav-buttons button {
      border-radius: 8px;
      padding: 8px 16px;
      transition: all 0.3s ease;
    }

    .nav-buttons button:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .nav-buttons button.active {
      background: rgba(255, 255, 255, 0.2);
      font-weight: 600;
    }

    .nav-buttons button mat-icon {
      margin-right: 8px;
    }

    .user-menu {
      margin-left: 8px;
    }

    .main-content {
      flex: 1;
      background: #F4FDFD;
    }

    @media (max-width: 768px) {
      .toolbar-title {
        font-size: 16px;
      }

      .nav-buttons {
        display: none;
      }

      .nav-buttons button mat-icon {
        margin-right: 4px;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  isAuthenticated = false;
  showConfigButton = false;
  title = 'PraXelo Enterprise11';

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🚀 AppComponent: Initializing...');

    // Subscribe to authentication status
    this.authService.isAuthenticated$.subscribe((isAuth: boolean) => {
      this.isAuthenticated = isAuth;
      this.showConfigButton = isAuth || this.configService.isConfigured();
      console.log('🔐 AppComponent: Auth status changed:', isAuth);
    });

    // Initial navigation logic - delay to avoid routing conflicts
    setTimeout(() => {
      this.handleInitialNavigation();
    }, 100);
  }

  private handleInitialNavigation(): void {
    console.log('🧭 AppComponent: Handling initial navigation...');

    if (!this.configService.isConfigured()) {
      console.log('⚙️ AppComponent: App not configured, redirecting to config');
      this.router.navigate(['/config']);
    } else if (!this.authService.isAuthenticated()) {
      console.log('🔐 AppComponent: User not authenticated, redirecting to login');
      this.router.navigate(['/login']);
    } else {
      console.log('✅ AppComponent: User authenticated, staying on current route');
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }

  goToConfig(): void {
    this.router.navigate(['/config']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
