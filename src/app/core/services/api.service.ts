// src/app/core/services/api.service.ts
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

    console.log('🌐 API: Getting services from:', `${url}?name=Service`);

    return this.http.get<ServicesResponse>(url, { params })
      .pipe(
        retry(2),
        map(response => {
          console.log('✅ API: Services loaded:', response.count, 'services');
          return response;
        }),
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

    console.log('🔄 API: Calling service flow API with URL:', `${url}?service=${serviceParam}`);

    return this.http.get<ServiceFlowResponse>(url, { params })
      .pipe(
        retry(2),
        map(response => {
          console.log('✅ API: Service flow loaded:', response);
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
   * This is the core method for choice fields
   */
  getLookupOptions(parentLookupId: number): Observable<LookupResponse> {
    const url = this.buildUrl('/lookups/');
    const params = new HttpParams().set('parent_lookup', parentLookupId.toString());

    console.log('🔍 API: Getting lookup options for parent:', parentLookupId, 'URL:', `${url}?parent_lookup=${parentLookupId}`);

    return this.http.get<LookupResponse>(url, { params })
      .pipe(
        retry(2),
        map(response => {
          console.log('✅ API: Lookup options loaded:', response.count, 'options for parent', parentLookupId);
          return response;
        }),
        catchError((error) => {
          console.error('❌ API: Error loading lookup options for parent', parentLookupId, ':', error);
          return this.handleError(error);
        })
      );
  }

  /**
   * Get lookup options by parent lookup name
   */
  getLookupOptionsByName(parentLookupName: string): Observable<LookupResponse> {
    const url = this.buildUrl('/lookups/');
    const params = new HttpParams().set('parent_lookup__name', parentLookupName);

    console.log('🔍 API: Getting lookup options by name:', parentLookupName);

    return this.http.get<LookupResponse>(url, { params })
      .pipe(
        retry(2),
        map(response => {
          console.log('✅ API: Lookup options by name loaded:', response.count, 'options');
          return response;
        }),
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

    console.log('📋 API: Getting applications:', status ? `with status ${status}` : 'all');

    return this.http.get<ApplicationsResponse>(url, { params })
      .pipe(
        retry(2),
        map(response => {
          console.log('✅ API: Applications loaded:', response.count, 'applications');
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Submit a new case/application
   * @param caseData - Case submission data
   */
  submitCase(caseData: CaseSubmission): Observable<any> {
    const url = this.buildUrl('/case/cases/');

    console.log('📤 API: Submitting case:', caseData);

    // Check if we have files to upload
    const hasFiles = this.hasFileData(caseData.case_data);

    if (hasFiles) {
      console.log('📎 API: Case has files, using FormData submission');
      return this.submitCaseWithFiles(url, caseData);
    } else {
      console.log('📄 API: Case has no files, using JSON submission');
      return this.submitCaseAsJson(url, caseData);
    }
  }

  /**
   * Submit the created case (final submission step)
   * @param caseId - The ID of the created case
   */
  submitCreatedCase(caseId: number): Observable<any> {
    const url = this.buildUrl(`/case/cases/submit/${caseId}/`);

    console.log('🚀 API: Submitting created case:', caseId);

    return this.http.put(url, {}, { headers: this.DEFAULT_HEADERS })
      .pipe(
        map(response => {
          console.log('✅ API: Case submitted successfully:', response);
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Update an existing case/application
   */
  updateCase(caseId: number, caseData: Partial<CaseSubmission>): Observable<any> {
    const url = this.buildUrl(`/case/cases/${caseId}/`);

    console.log('🔄 API: Updating case:', caseId, caseData);

    const hasFiles = this.hasFileData(caseData.case_data || {});

    if (hasFiles) {
      return this.submitCaseWithFiles(url, caseData, 'PUT');
    } else {
      return this.http.put(url, caseData, { headers: this.DEFAULT_HEADERS })
        .pipe(
          map(response => {
            console.log('✅ API: Case updated successfully:', response);
            return response;
          }),
          catchError(this.handleError)
        );
    }
  }

  /**
   * Get a specific case/application
   */
  getCase(caseId: number): Observable<any> {
    const url = this.buildUrl(`/case/cases/${caseId}/`);

    console.log('🔍 API: Getting case:', caseId);

    return this.http.get(url)
      .pipe(
        retry(2),
        map(response => {
          console.log('✅ API: Case loaded:', response);
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Delete a case/application
   */
  deleteCase(caseId: number): Observable<any> {
    const url = this.buildUrl(`/case/api/cases/${caseId}/`);

    console.log('🗑️ API: Deleting case:', caseId);

    return this.http.delete(url)
      .pipe(
        map(response => {
          console.log('✅ API: Case deleted successfully');
          return response;
        }),
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

    console.log('📎 API: Uploading file:', file.name, 'for field:', fieldName);

    return this.http.post(url, formData)
      .pipe(
        map(response => {
          console.log('✅ API: File uploaded successfully:', response);
          return response;
        }),
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
      map(response => {
        console.log('✅ API: Case submitted (JSON):', response);
        return response;
      }),
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

    // Prepare case_data object (excluding files)
    const caseDataForJson: any = {};
    const files: File[] = [];
    const fileTypes: string[] = [];

    // Process case_data to separate files from other data
    if (caseData.case_data) {
      for (const [key, value] of Object.entries(caseData.case_data)) {
        if (value instanceof File) {
          files.push(value);
          // For file fields, we need to determine the file type based on the field configuration
          // This should be passed from the dynamic form component
          fileTypes.push('01'); // Default file type, should be configured properly
        } else if (value !== null && value !== undefined) {
          caseDataForJson[key] = value;
        }
      }
    }

    // Add case_data as JSON string
    formData.append('case_data', JSON.stringify(caseDataForJson));

    // Add files with proper indexing
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file, file.name);
    });

    // Add file_types array (this should be provided from the form)
    if (caseData.file_types && Array.isArray(caseData.file_types)) {
      caseData.file_types.forEach((fileType: string, index: number) => {
        formData.append(`file_types[${index}]`, fileType);
      });
    } else {
      // Use default file types if not provided
      fileTypes.forEach((fileType: string, index: number) => {
        formData.append(`file_types[${index}]`, fileType);
      });
    }

    console.log('🔄 API: Submitting form data:', {
      applicant_type: caseData.applicant_type,
      case_type: caseData.case_type,
      case_data: caseDataForJson,
      files_count: files.length,
      file_types: caseData.file_types || fileTypes
    });

    const request = method === 'PUT'
      ? this.http.put(url, formData)
      : this.http.post(url, formData);

    return request.pipe(
      map(response => {
        console.log('✅ API: Case submitted (FormData):', response);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Check if case data contains files
   */
  private hasFileData(caseData: { [key: string]: any }): boolean {
    const hasFiles = Object.values(caseData || {}).some(value => value instanceof File);
    console.log('📎 API: Case has files:', hasFiles);
    return hasFiles;
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
    console.error('❌ API Error:', error);

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
          if (error.error && error.error.detail) {
            errorMessage += ` Details: ${error.error.detail}`;
          }
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

    // Log additional error details for debugging
    if (error.error) {
      console.error('Error details:', error.error);
    }

    return throwError(() => new Error(errorMessage));
  };
}
