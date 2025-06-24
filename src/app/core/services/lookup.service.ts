// src/app/core/services/lookup.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ServicesResponse } from '../models/service.model';

@Injectable({
  providedIn: 'root'
})
export class LookupService {
  constructor(private apiService: ApiService) {}

  getServices(): Observable<ServicesResponse> {
    return this.apiService.get<ServicesResponse>('/lookups/?name=Service');
  }

  getLookupOptions(parentLookupId: number): Observable<any> {
    return this.apiService.get(`/lookups/lookup/lookup/?parent_lookup=${parentLookupId}`);
  }
}
