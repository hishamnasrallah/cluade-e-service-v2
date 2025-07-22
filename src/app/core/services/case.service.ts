// src/app/core/services/case.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CasesResponse, Case } from '../models/case.model';
import { Application, ApplicationsResponse, CaseSubmission } from '../models/interfaces';

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
    return this.apiService.delete(`/case/cases/${id}/`);
  }

  submitCase(id: number): Observable<any> {
    return this.apiService.put(`/case/cases/submit/${id}/`, {});
  }

  // Additional methods for applicant actions implementation

  // Get applicant's cases with available actions (alias for existing getCases)
  getMyCases(): Observable<CasesResponse> {
    return this.getCases();
  }

  // Get specific case details with available actions (using Application interface)
  getCaseById(caseId: number): Observable<Application> {
    return this.apiService.getCase(caseId);
  }

  // Submit an action on a case
  submitApplicantAction(caseId: number, actionData: { action_id: number; notes?: string }): Observable<any> {
    return this.apiService.performApplicantAction(caseId, actionData.action_id, actionData.notes);
  }

  // Update case data (using partial CaseSubmission)
  updateCaseData(caseId: number, caseData: Partial<CaseSubmission>): Observable<any> {
    return this.apiService.updateCase(caseId, caseData);
  }
}
