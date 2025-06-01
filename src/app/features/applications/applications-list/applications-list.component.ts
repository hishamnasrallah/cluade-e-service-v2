// src/app/features/applications/applications-list/applications-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CaseService } from '../../../core/services/case.service';
import { Case } from '../../../core/models/case.model';
import {LoadingComponent} from '../../shared/components/loading/loading.component';
import {ErrorMessageComponent} from '../../shared/components/error-message/error-message.component';
import {DatePipe} from '@angular/common';

@Component({
  selector: 'app-applications-list',
  templateUrl: './applications-list.component.html',
  imports: [
    LoadingComponent,
    ErrorMessageComponent,
    DatePipe
  ],
  styleUrls: ['./applications-list.component.scss']
})
export class ApplicationsListComponent implements OnInit {
  applications: Case[] = [];
  filteredApplications: Case[] = [];
  loading = false;
  error = '';
  activeTab = 'all';

  constructor(
    private caseService: CaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading = true;
    this.error = '';

    this.caseService.getCases().subscribe({
      next: (response) => {
        this.applications = response.results;
        this.filterApplications();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load applications';
        this.loading = false;
        console.error('Applications loading error:', error);
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.filterApplications();
  }

  filterApplications(): void {
    switch (this.activeTab) {
      case 'draft':
        this.filteredApplications = this.applications.filter(app => app.status === 20);
        break;
      case 'returned':
        this.filteredApplications = this.applications.filter(app => app.status === 44);
        break;
      case 'submitted':
        this.filteredApplications = this.applications.filter(app => app.status === 11);
        break;
      case 'completed':
        this.filteredApplications = this.applications.filter(app => app.status === 21);
        break;
      default:
        this.filteredApplications = this.applications;
    }
  }

  viewApplication(application: Case): void {
    this.router.navigate(['/application', application.id]);
  }

  deleteApplication(application: Case, event: Event): void {
    event.stopPropagation();

    if (confirm('Are you sure you want to delete this application?')) {
      this.caseService.deleteCase(application.id).subscribe({
        next: () => {
          this.loadApplications();
        },
        error: (error) => {
          console.error('Delete error:', error);
          alert('Failed to delete application');
        }
      });
    }
  }

  getStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      20: 'Draft',
      11: 'Submitted',
      21: 'Completed',
      44: 'Returned'
    };
    return statusMap[status] || 'Unknown';
  }
}
