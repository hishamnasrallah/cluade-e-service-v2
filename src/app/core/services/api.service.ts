// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, retry } from 'rxjs/operators';

import { ConfigService } from './config.service';
import {
  ServicesResponse,
  ServiceFlowResponse,
  LookupResponse,
  ApplicationsResponse,
  CaseSubmission,
  ApiResponse
} from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  /**
   * Get services from lookups API
   */
  getServices(): Observable<ServicesResponse> {
    const url = this.buildUrl('/lookups/');
    const params = new HttpParams().set('name', 'Service');

    return this.http.get<ServicesResponse>(url, { params })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Get service flow for a specific service using service CODE (not ID)
   * @param serviceCode - The service code (e.g., "01", "03", "05")
   */
  getServiceFlow(serviceCode: string): Observable<ServiceFlowResponse> {
    const url = this.buildUrl('/dynamic/service_flow/');

    // Format the service code as an array in the URL parameter
    // The API expects: ?service=["01"] format
    const serviceParam = `["${serviceCode}"]`;
    const params = new HttpParams().set('service', serviceParam);

    console.log('🔄 Calling service flow API with URL:', `${url}?service=${serviceParam}`);

    return this.http.get<ServiceFlowResponse>(url, { params })
      .pipe(
        retry(2),
        map(response => {
          console.log('✅ Service flow API response:', response);
          // Sort service flow steps by sequence_number
          if (response.service_flow) {
            response.service_flow.sort((a, b) =>
              parseInt(a.sequence_number) - parseInt(b.sequence_number)
            );
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get lookup options by parent lookup ID
   */
  getLookupOptions(parentLookupId: number): Observable<LookupResponse> {
    const url = this.buildUrl('/lookups/');
    const params = new HttpParams().set('parent_lookup', parentLookupId.toString());

    return this.http.get<LookupResponse>(url, { params })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Get lookup options by parent lookup name
   */
  getLookupOptionsByName(parentLookupName: string): Observable<LookupResponse> {
    const url = this.buildUrl('/lookups/');
    const params = new HttpParams().set('parent_lookup__name', parentLookupName);

    return this.http.get<LookupResponse>(url, { params })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Get user applications with filtering
   */
  getApplications(status?: string): Observable<ApplicationsResponse> {
    const url = this.buildUrl('/case/cases/');
    let params = new HttpParams();

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ApplicationsResponse>(url, { params })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Submit a new case/application
   * @param caseData - Case submission data
   */
  submitCase(caseData: CaseSubmission): Observable<any> {
    const url = this.buildUrl('/case/cases/');

    // Check if we have files to upload
    const hasFiles = this.hasFileData(caseData.case_data);

    if (hasFiles) {
      return this.submitCaseWithFiles(url, caseData);
    } else {
      return this.submitCaseAsJson(url, caseData);
    }
  }

  /**
   * Update an existing case/application
   */
  updateCase(caseId: number, caseData: Partial<CaseSubmission>): Observable<any> {
    const url = this.buildUrl(`/case/cases/${caseId}/`);

    const hasFiles = this.hasFileData(caseData.case_data || {});

    if (hasFiles) {
      return this.submitCaseWithFiles(url, caseData, 'PUT');
    } else {
      return this.http.put(url, caseData, { headers: this.DEFAULT_HEADERS })
        .pipe(
          catchError(this.handleError)
        );
    }
  }

  /**
   * Get a specific case/application
   */
  getCase(caseId: number): Observable<any> {
    const url = this.buildUrl(`/case/cases/${caseId}/`);

    return this.http.get(url)
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Delete a case/application
   */
  deleteCase(caseId: number): Observable<any> {
    const url = this.buildUrl(`/case/cases/${caseId}/`);

    return this.http.delete(url)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Upload a file
   */
  uploadFile(file: File, fieldName: string): Observable<any> {
    const url = this.buildUrl('/files/upload/');
    const formData = new FormData();
    formData.append(fieldName, file, file.name);

    return this.http.post(url, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Generic GET request
   */
  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    const url = this.buildUrl(endpoint);

    return this.http.get<T>(url, { params })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Generic POST request
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    const url = this.buildUrl(endpoint);

    return this.http.post<T>(url, data, { headers: this.DEFAULT_HEADERS })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Generic PUT request
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    const url = this.buildUrl(endpoint);

    return this.http.put<T>(url, data, { headers: this.DEFAULT_HEADERS })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Generic DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    const url = this.buildUrl(endpoint);

    return this.http.delete<T>(url)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Submit case as JSON (no files)
   */
  private submitCaseAsJson(url: string, caseData: any, method: string = 'POST'): Observable<any> {
    const request = method === 'PUT'
      ? this.http.put(url, caseData, { headers: this.DEFAULT_HEADERS })
      : this.http.post(url, caseData, { headers: this.DEFAULT_HEADERS });

    return request.pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Submit case with files using FormData
   */
  private submitCaseWithFiles(url: string, caseData: any, method: string = 'POST'): Observable<any> {
    const formData = new FormData();

    // Add non-file fields
    if (caseData.applicant_type) {
      formData.append('applicant_type', caseData.applicant_type.toString());
    }
    if (caseData.case_type) {
      formData.append('case_type', caseData.case_type.toString());
    }

    // Add case_data fields
    if (caseData.case_data) {
      for (const [key, value] of Object.entries(caseData.case_data)) {
        if (value instanceof File) {
          formData.append(key, value, value.name);
        } else if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      }
    }

    // Add file_types if present
    if (caseData.file_types && Array.isArray(caseData.file_types)) {
      caseData.file_types.forEach((fileType: string, index: number) => {
        formData.append(`file_types[${index}]`, fileType);
      });
    }

    const request = method === 'PUT'
      ? this.http.put(url, formData)
      : this.http.post(url, formData);

    return request.pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Check if case data contains files
   */
  private hasFileData(caseData: { [key: string]: any }): boolean {
    return Object.values(caseData || {}).some(value => value instanceof File);
  }

  /**
   * Build full URL from endpoint
   */
  private buildUrl(endpoint: string): string {
    const baseUrl = this.configService.getBaseUrl();

    if (!baseUrl) {
      throw new Error('Base URL not configured');
    }

    // Ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;

    return `${baseUrl}${cleanEndpoint}`;
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: any): Observable<never> => {
    console.error('API Error:', error);

    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
          break;
        case 400:
          errorMessage = 'Bad request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please login again.';
          break;
        case 403:
          errorMessage = 'Access denied. You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  };
}
