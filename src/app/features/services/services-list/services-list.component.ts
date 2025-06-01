// src/app/features/services/services-list/services-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LookupService } from '../../../core/services/lookup.service';
import { Service } from '../../../core/models/service.model';
import {LoadingComponent} from '../../shared/components/loading/loading.component';
import {ErrorMessageComponent} from '../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-services-list',
  templateUrl: './services-list.component.html',
  imports: [
    LoadingComponent,
    ErrorMessageComponent
  ],
  styleUrls: ['./services-list.component.scss']
})
export class ServicesListComponent implements OnInit {
  services: Service[] = [];
  loading = false;
  error = '';

  constructor(
    private lookupService: LookupService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.loading = true;
    this.error = '';

    this.lookupService.getServices().subscribe({
      next: (response) => {
        this.services = response.results;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load services';
        this.loading = false;
        console.error('Services loading error:', error);
      }
    });
  }

  selectService(service: Service): void {
    this.router.navigate(['/service', service.code]);
  }
}
