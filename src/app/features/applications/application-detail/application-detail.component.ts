// src/app/features/applications/application-detail/application-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CaseService } from '../../../core/services/case.service';
import { Case } from '../../../core/models/case.model';
import {LoadingComponent} from '../../shared/components/loading/loading.component';
import {ErrorMessageComponent} from '../../shared/components/error-message/error-message.component';
import {DatePipe, KeyValuePipe, NgIf} from '@angular/common';

@Component({
  selector: 'app-application-detail',
  templateUrl: './application-detail.component.html',
  imports: [
    LoadingComponent,
    ErrorMessageComponent,
    DatePipe,
    KeyValuePipe,
    NgIf
  ],
  styleUrls: ['./application-detail.component.scss']
})
export class ApplicationDetailComponent implements OnInit {
  application: Case | null = null;
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private caseService: CaseService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadApplication(+id);
    }
  }

  loadApplication(id: number): void {
    this.loading = true;
    this.error = '';

    this.caseService.getCase(id).subscribe({
      next: (application) => {
        this.application = application;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load application details';
        this.loading = false;
        console.error('Application loading error:', error);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  downloadFile(fileUrl: string): void {
    window.open(fileUrl, '_blank');
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
