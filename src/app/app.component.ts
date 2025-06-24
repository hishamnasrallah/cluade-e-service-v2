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
          PraXelo Enterprise
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
      background: linear-gradient(135deg, #2EC4B6 0%, #2BA99B 100%)
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
  title = 'PraXelo Enterprise';

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
