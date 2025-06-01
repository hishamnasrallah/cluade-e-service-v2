// src/app/core/services/case.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CasesResponse, Case } from '../models/case.model';

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  constructor(private apiService: ApiService) {}

  getCases(): Observable<CasesResponse> {
    return this.apiService.get<CasesResponse>('/case/cases/');
  }

  getCase(id: number): Observable<Case> {
    return this.apiService.get<Case>(`/case/cases/${id}/`);
  }

  createCase(formData: FormData): Observable<Case> {
    return this.apiService.post<Case>('/case/cases/', formData);
  }

  updateCase(id: number, data: any): Observable<Case> {
    return this.apiService.put<Case>(`/case/cases/${id}/`, data);
  }

  deleteCase(id: number): Observable<any> {
    return this.apiService.delete(`/case/api/cases/${id}/`);
  }

  submitCase(id: number): Observable<any> {
    return this.apiService.put(`/case/cases/submit/${id}/`, {});
  }
}
