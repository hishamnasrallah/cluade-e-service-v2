import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ApiService } from '../../services/api.service';
import { Application, ApplicationsResponse, ApplicationStatus } from '../../models/interfaces';
import { ApplicationsListComponent } from '../applications/applications-list/applications-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    ApplicationsListComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  applications: Application[] = [];
  isLoading = false;
  selectedTabIndex = 0;

  applicationStats = [
    { icon: 'edit', label: 'Draft', colorClass: 'draft', count: 0 },
    { icon: 'undo', label: 'Returned', colorClass: 'returned', count: 0 },
    { icon: 'send', label: 'Submitted', colorClass: 'submitted', count: 0 },
    { icon: 'check_circle', label: 'Completed', colorClass: 'completed', count: 0 }
  ];

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading = true;

    this.apiService.getApplications().subscribe({
      next: (response: ApplicationsResponse) => {
        this.applications = response.results || [];
        this.updateStats();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading applications:', error);
        this.applications = [];
        this.updateStats();
        this.isLoading = false;
      }
    });
  }

  refreshApplications(): void {
    this.loadApplications();
  }

  getApplicationsByStatus(status: ApplicationStatus): Application[] {
    return this.applications.filter(app => app.status === status);
  }

  updateStats(): void {
    this.applicationStats.forEach(stat => {
      const statusKey = stat.label.toLowerCase() as ApplicationStatus;
      stat.count = this.getApplicationsByStatus(statusKey).length;
    });
  }

  onTabChange(event: any): void {
    this.selectedTabIndex = event.index;
  }

  goToServices(): void {
    this.router.navigate(['/services']);
  }

  // Application actions
  editApplication(application: Application): void {
    console.log('Edit application:', application);
    // Navigate to edit flow or open edit modal
  }

  viewApplication(application: Application): void {
    console.log('View application:', application);
    // Navigate to view page or open view modal
  }

  deleteApplication(application: Application): void {
    if (confirm(`Are you sure you want to delete this application?`)) {
      this.apiService.deleteCase(application.id).subscribe({
        next: () => {
          this.loadApplications(); // Refresh list
          console.log('Application deleted successfully');
        },
        error: (error: any) => {
          console.error('Error deleting application:', error);
        }
      });
    }
  }

  continueApplication(application: Application): void {
    console.log('Continue application:', application);
    // Navigate to continue the application flow
  }

  resubmitApplication(application: Application): void {
    console.log('Resubmit application:', application);
    // Navigate to resubmit flow
  }

  trackApplication(application: Application): void {
    console.log('Track application:', application);
    // Show tracking information
  }

  downloadApplication(application: Application): void {
    console.log('Download application:', application);
    // Download application documents
  }
}
