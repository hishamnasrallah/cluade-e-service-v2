// src/app/core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, retry } from 'rxjs/operators';

import { ConfigService } from './config.service';
import { LookupCacheService } from './lookup-cache.service';
import {
  ServicesResponse,
  ServiceFlowResponse,
  LookupResponse,
  ApplicationsResponse,
  CaseSubmission,
  ApiResponse,
  ApplicantAction // Import ApplicantAction
} from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Default headers for JSON requests only
  private readonly JSON_HEADERS = {
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

    return this.http.get<ServicesResponse>(url, {
      params,
      headers: this.JSON_HEADERS
    }).pipe(
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

    return this.http.get<ServiceFlowResponse>(url, {
      params,
      headers: this.JSON_HEADERS
    }).pipe(
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

    return this.http.get<LookupResponse>(url, {
      params,
      headers: this.JSON_HEADERS
    }).pipe(
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

    return this.http.get<LookupResponse>(url, {
      params,
      headers: this.JSON_HEADERS
    }).pipe(
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

    return this.http.get<ApplicationsResponse>(url, {
      params,
      headers: this.JSON_HEADERS
    }).pipe(
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
   * ALWAYS uses FormData to avoid Content-Type issues
   * @param caseData - Case submission data
   */
  submitCase(caseData: CaseSubmission): Observable<any> {
    const url = this.buildUrl('/case/cases/');

    console.log('📤 API: Submitting case:', caseData);

    // ALWAYS use FormData for case submissions to ensure consistency
    return this.submitCaseAsFormData(url, caseData, 'POST');
  }

  /**
   * Submit the created case (final submission step)
   * @param caseId - The ID of the created case
   */
  submitCreatedCase(caseId: number): Observable<any> {
    const url = this.buildUrl(`/case/cases/submit/${caseId}/`);

    console.log('🚀 API: Submitting created case:', caseId);

    // This endpoint likely expects JSON
    return this.http.put(url, {}, { headers: this.JSON_HEADERS })
      .pipe(
        map(response => {
          console.log('✅ API: Case submitted successfully:', response);
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Update an existing case/application (for continuing applications)
   * Uses PUT method to the /case/cases/{id}/ endpoint
   * @param caseId - The ID of the case to update
   * @param caseData - Updated case data
   */
  updateCase(caseId: number, caseData: Partial<CaseSubmission>): Observable<any> {
    const url = this.buildUrl(`/case/cases/${caseId}/`);

    console.log('🔄 API: Updating case:', caseId, caseData);

    // Always use FormData for case updates to maintain consistency
    return this.submitCaseAsFormData(url, caseData, 'PUT');
  }

  /**
   * Continue/edit an existing application
   * This is an alias for updateCase but with more specific logging
   * @param applicationId - The ID of the application to continue
   * @param caseData - Updated case data
   */
  continueApplication(applicationId: number, caseData: Partial<CaseSubmission>): Observable<any> {
    console.log('🔄 API: Continuing application:', applicationId);
    return this.updateCase(applicationId, caseData).pipe(
      map(response => {
        console.log('✅ API: Application continued successfully:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ API: Error continuing application:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Get a specific case/application
   */
  getCase(caseId: number): Observable<any> {
    const url = this.buildUrl(`/case/cases/${caseId}/`);

    console.log('🔍 API: Getting case:', caseId);

    return this.http.get(url, { headers: this.JSON_HEADERS })
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
   * Uses the correct endpoint: /case/cases/{id}/
   */
  deleteCase(caseId: number): Observable<any> {
    const url = this.buildUrl(`/case/cases/${caseId}/`);

    console.log('🗑️ API: Deleting case:', caseId);

    return this.http.delete(url, { headers: this.JSON_HEADERS })
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

    // DO NOT set Content-Type header - let browser handle it
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
   * Get service code from case type (service ID) using direct lookup
   * @param caseType - The service ID (case_type from application)
   */
  getServiceCodeFromCaseType(caseType: number): Observable<string> {
    // This method now just delegates to the cache service
    // Remove direct API call to avoid duplication
    console.log('🔍 API: Delegating service code lookup to cache service for case type:', caseType);

    // Note: We need to inject LookupCacheService, but to avoid circular dependency,
    // we'll keep this method as is and update the components to use LookupCacheService directly
    const url = this.buildUrl('/lookups/');
    const params = new HttpParams().set('id', caseType.toString());

    console.log('🔍 API: Getting service code for case type (service ID):', caseType, 'URL:', `${url}?id=${caseType}`);

    return this.http.get<LookupResponse>(url, {
      params,
      headers: this.JSON_HEADERS
    }).pipe(
      retry(2),
      map(response => {
        console.log('✅ API: Lookup response for service ID', caseType, ':', response);

        if (response.results && response.results.length > 0) {
          const service = response.results[0];
          console.log('✅ API: Found service:', service.name, 'Code:', service.code);
          return service.code;
        } else {
          console.warn('⚠️ API: No service found for ID', caseType, 'defaulting to "01"');
          return '01'; // Default fallback
        }
      }),
      catchError(error => {
        console.error('❌ API: Error fetching service for ID', caseType, ':', error);
        // Return default service code as fallback
        return of('01');
      })
    );
  }

  /**
   * Generic GET request
   */
  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    const url = this.buildUrl(endpoint);

    return this.http.get<T>(url, {
      params,
      headers: this.JSON_HEADERS
    }).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }
  /**
   * Perform an applicant action on a case
   * @param caseId The ID of the case
   * @param actionId The ID of the action to perform
   * @param notes Optional notes for the action
   */
  performApplicantAction(caseId: number, actionId: number, notes?: string): Observable<any> {
    const url = this.buildUrl(`/case/cases/${caseId}/applicant-action/`);
    const body = {
      action_id: actionId,
      notes: notes || ''
    };

    console.log('🚀 API: Performing applicant action:', { caseId, actionId, notes });

    return this.http.post(url, body, { headers: this.JSON_HEADERS })
      .pipe(
        map(response => {
          console.log('✅ API: Applicant action performed successfully:', response);
          // Ensure response has the expected structure
          return response || { action_name: 'Action' };
        }),
        catchError(this.handleError)
      );
  }
  /**
   * Generic POST request
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    const url = this.buildUrl(endpoint);

    return this.http.post<T>(url, data, { headers: this.JSON_HEADERS })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Generic PUT request
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    const url = this.buildUrl(endpoint);

    return this.http.put<T>(url, data, { headers: this.JSON_HEADERS })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Generic DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    const url = this.buildUrl(endpoint);

    return this.http.delete<T>(url, { headers: this.JSON_HEADERS })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Submit case using FormData (for both with and without files)
   * This ensures consistent Content-Type handling
   */
  private submitCaseAsFormData(url: string, caseData: any, method: string = 'POST'): Observable<any> {
    const formData = new FormData();

    console.log('📦 API: Preparing FormData submission:', { method, url });

    // Add basic case fields
    if (caseData.applicant_type) {
      formData.append('applicant_type', caseData.applicant_type.toString());
    }
    if (caseData.case_type) {
      formData.append('case_type', caseData.case_type.toString());
    }

    // Process case_data to separate files from other data
    const caseDataForJson: any = {};
    const files: { file: File, fieldName: string, fileType: string }[] = [];

    if (caseData.case_data) {
      for (const [key, value] of Object.entries(caseData.case_data)) {
        if (value instanceof File) {
          // Only process actual File objects, not URLs or strings
          const fileType = caseData.file_types_mapping?.[key];

          if (fileType) {
            files.push({
              file: value,
              fieldName: key,
              fileType: fileType
            });

            console.log('📎 API: Added file:', value.name, 'for field:', key, 'with type:', fileType);
          }

          // Don't add file fields to case_data at all
        } else if (typeof value === 'string' && value.startsWith('/media/uploads/')) {
          // Skip existing file URLs - these are already on the server
          console.log('⏭️ API: Skipping existing file URL for field:', key);
        } else if (value !== null && value !== undefined) {
          // Add non-file fields to case_data
          caseDataForJson[key] = value;
        }
      }
    }

// Add case_data as JSON string
    formData.append('case_data', JSON.stringify(caseDataForJson));

// Add files and their types in the correct format
    files.forEach((fileInfo, index) => {
      // Add file as files[index]
      formData.append(`files[${index}]`, fileInfo.file, fileInfo.file.name);
      // Add file type as file_types[index]
      formData.append(`file_types[${index}]`, fileInfo.fileType);

      console.log(`📎 API: FormData - files[${index}]:`, fileInfo.file.name, `file_types[${index}]:`, fileInfo.fileType);
    });

    console.log('🔄 API: FormData prepared:', {
      method,
      applicant_type: caseData.applicant_type,
      case_type: caseData.case_type,
      case_data_fields: Object.keys(caseDataForJson),
      files_count: files.length,
      // file_fields: fileFields,
      file_types_count: caseData.file_types?.length || files.length
    });

    // Make the HTTP request without setting Content-Type
    // The browser will automatically set "multipart/form-data" with boundary
    const request = method === 'PUT'
      ? this.http.put(url, formData) // No headers specified
      : this.http.post(url, formData); // No headers specified

    return request.pipe(
      map(response => {
        console.log('✅ API: Case submitted (FormData):', response);
        return response;
      }),
      catchError(this.handleError)
    );
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
        case 415:
          errorMessage = 'Unsupported media type. The server cannot process the request format.';
          if (error.error && error.error.detail) {
            errorMessage += ` Details: ${error.error.detail}`;
          }
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
