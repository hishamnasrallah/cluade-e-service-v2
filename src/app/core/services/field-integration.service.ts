// src/app/core/services/field-integration.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, delay, retry } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ConfigService } from './config.service';
import {
  FieldIntegration,
  ServiceFlowField,
  IntegrationCallLog
} from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FieldIntegrationService {
  private integrationLogs: IntegrationCallLog[] = [];

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Process field integrations for a specific trigger event
   */
  async processFieldIntegrations(
    field: ServiceFlowField,
    fieldValue: any,
    formData: { [key: string]: any },
    triggerEvent: 'on_change' | 'pre_save' | 'post_save'
  ): Promise<{ [key: string]: any }> {
    if (!field.integrations || field.integrations.length === 0) {
      return {};
    }

    console.log(`🔄 Integration: Processing ${triggerEvent} integrations for field ${field.name}`);

    // Get integrations for this trigger event
    const integrations = field.integrations
      .filter(integration => integration.trigger_event === triggerEvent)
      .sort((a, b) => a.order - b.order);

    if (integrations.length === 0) {
      return {};
    }

    const updatedFields: { [key: string]: any } = {};

    // Process integrations sequentially (respecting order)
    for (const integration of integrations) {
      try {
        // Check if integration should execute
        if (!this.shouldExecuteIntegration(integration, fieldValue, formData)) {
          console.log(`⏭️ Integration: Skipping ${integration.integration_name} - condition not met`);
          continue;
        }

        // Execute the integration
        const result = await this.executeIntegration(
          integration,
          field,
          fieldValue,
          formData
        );

        // Merge updated fields
        if (result && integration.updates_fields) {
          Object.assign(updatedFields, result);
          // Update formData for subsequent integrations
          Object.assign(formData, result);
        }

      } catch (error) {
        console.error(`❌ Integration: Error executing ${integration.integration_name}:`, error);

        if (!integration.is_async) {
          // For synchronous integrations, show error to user
          this.snackBar.open(
            `Failed to execute ${integration.integration_name}`,
            'Close',
            { duration: 3000, panelClass: ['error-snackbar'] }
          );
        }
      }
    }

    return updatedFields;
  }

  /**
   * Check if integration should execute based on conditions
   */
  private shouldExecuteIntegration(
    integration: FieldIntegration,
    fieldValue: any,
    formData: { [key: string]: any }
  ): boolean {
    // Check min length trigger
    if (integration.min_length_trigger) {
      const valueStr = String(fieldValue || '');
      if (valueStr.length < integration.min_length_trigger) {
        return false;
      }
    }

    // Check condition expression
    if (integration.has_condition && integration.condition_expression) {
      try {
        // Create a safe evaluation context
        const evalContext = {
          field_value: fieldValue,
          case_data: formData,
          ...formData // Also expose all form fields directly
        };

        // Evaluate the condition expression
        const condition = new Function(
          ...Object.keys(evalContext),
          `return ${integration.condition_expression}`
        );

        const result = condition(...Object.values(evalContext));
        return Boolean(result);
      } catch (error) {
        console.error('❌ Integration: Error evaluating condition:', error);
        return false;
      }
    }

    return true;
  }

  /**
   * Execute a field integration
   */
  /**
   * Execute a field integration
   */
  private async executeIntegration(
    integration: FieldIntegration,
    field: ServiceFlowField,
    fieldValue: any,
    formData: { [key: string]: any }
  ): Promise<{ [key: string]: any } | null> {
    console.log(`🚀 Integration: Executing ${integration.integration_name}`);

    // Integration details are already in the field integration object from service flow
    // Build the request using the integration configuration
    const request = this.buildIntegrationRequest(
      integration,
      fieldValue,
      formData
    );

    // Make the API call
    const startTime = Date.now();

    try {
      const response = await this.makeIntegrationCall(request, integration).toPromise();

      // Log the integration call
      this.logIntegrationCall({
        field_name: field.name,
        integration_name: integration.integration_name,
        request_url: request.url,
        request_data: request.body || request.params,
        response_data: response,
        status_code: 200,
        created_at: new Date().toISOString()
      } as IntegrationCallLog);

      console.log(`✅ Integration: ${integration.integration_name} completed in ${Date.now() - startTime}ms`);

      // Process the response
      if (integration.updates_fields && response) {
        return this.processIntegrationResponse(integration, response);
      }

      return null;
    } catch (error: any) {
      // Log the failed integration call
      this.logIntegrationCall({
        field_name: field.name,
        integration_name: integration.integration_name,
        request_url: request.url,
        request_data: request.body || request.params,
        response_data: null,
        status_code: error.status || 0,
        error_message: error.message,
        created_at: new Date().toISOString()
      } as IntegrationCallLog);

      throw error;
    }
  }


  /**
   * Build the integration request
   */
  private buildIntegrationRequest(
    fieldIntegration: FieldIntegration,
    fieldValue: any,
    formData: { [key: string]: any }
  ): any {
    // Use the endpoint from the integration configuration
    let url = fieldIntegration.endpoint || '';

    // If URL is relative, prepend base URL
    if (!url.startsWith('http')) {
      const baseUrl = this.configService.getBaseUrl();
      url = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
    }
    const headers = this.getIntegrationHeaders(fieldIntegration);
    let params = new HttpParams();
    let body: { [key: string]: any } | null = null;
    // Build path parameters
    const pathParams = fieldIntegration.path_param_mapping || {};
    for (const [placeholder, fieldName] of Object.entries(pathParams)) {
      const value = fieldName === 'field_value' ? fieldValue : formData[fieldName];
      if (value !== undefined && value !== null) {
        url = url.replace(`{${placeholder}}`, encodeURIComponent(String(value)));
      }
    }


    // for (const [placeholder, fieldName] of Object.entries(pathParams)) {
    //   const value = fieldName === 'field_value' ? fieldValue : formData[fieldName];
    //   url = url.replace(`{${placeholder}}`, encodeURIComponent(value));
    // }

    // Build query parameters
    for (const [placeholder, fieldName] of Object.entries(pathParams)) {
      const value = fieldName === 'field_value' ? fieldValue : formData[fieldName as string];
      url = url.replace(`{${placeholder}}`, encodeURIComponent(value));
    }

    // Build query parameters
    const queryParams = fieldIntegration.query_param_mapping || {};

    for (const [paramName, fieldName] of Object.entries(queryParams)) {
      const value = fieldName === 'field_value' ? fieldValue : formData[fieldName as string];
      if (value !== undefined && value !== null) {
        params = params.set(paramName, value);
      }
    }

    // Get HTTP method
    const method = this.getIntegrationMethod(fieldIntegration);

    // Build request body for POST/PUT
    if (method === 'POST' || method === 'PUT') {
      body = {} as { [key: string]: any };

      if (fieldIntegration.payload_mapping) {
        for (const [bodyField, formField] of Object.entries(fieldIntegration.payload_mapping)) {
          const value = formField === 'field_value' ? fieldValue : formData[formField];
          body[bodyField] = value;
        }
      }
    }

    // Build headers with field mapping
    if (fieldIntegration.header_mapping) {
      for (const [headerName, fieldName] of Object.entries(fieldIntegration.header_mapping)) {
        const value = fieldName === 'field_value' ? fieldValue : formData[fieldName as string];
        headers[headerName] = value;
      }
    }

    return { url, method, headers, params, body };

  }

  /**
   * Make the actual integration API call
   */
  private makeIntegrationCall(request: any, integration: FieldIntegration): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders(request.headers),
      params: request.params
    };

    let httpCall: Observable<any>;

    switch (request.method) {
      case 'GET':
        httpCall = this.http.get(request.url, httpOptions);
        break;
      case 'POST':
        httpCall = this.http.post(request.url, request.body, httpOptions);
        break;
      case 'PUT':
        httpCall = this.http.put(request.url, request.body, httpOptions);
        break;
      case 'DELETE':
        httpCall = this.http.delete(request.url, httpOptions);
        break;
      default:
        return throwError(() => new Error(`Unsupported HTTP method: ${request.method}`));
    }

    // Add retry logic (get from integration config if available)
    const maxRetries = (integration as any).max_retries || 3;
    const retryDelay = (integration as any).retry_delay || 1;

    return httpCall.pipe(
      retry({
        count: maxRetries,
        delay: (error, retryCount) => {
          console.log(`🔄 Integration: Retry attempt ${retryCount} after ${retryDelay}s`);
          return of(error).pipe(delay(retryDelay * 1000));
        }
      }),
      catchError(error => {
        console.error('❌ Integration: API call failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Process integration response and extract field updates
   */
  private processIntegrationResponse(
    integration: FieldIntegration,
    response: any
  ): { [key: string]: any } {
    const updates: { [key: string]: any } = {};

    // Handle response_field_path (single value extraction)
    if (integration.response_field_path && integration.target_fields?.length > 0) {
      const value = this.extractValueFromPath(response, integration.response_field_path);
      if (value !== undefined) {
        // Map to first target field
        updates[integration.target_fields[0]] = value;
      }
    }

    // Handle response_field_mapping (multiple field mapping)
    if (integration.response_field_mapping) {
      for (const [responsePath, targetField] of Object.entries(integration.response_field_mapping)) {
        const value = this.extractValueFromPath(response, responsePath);
        if (value !== undefined) {
          updates[targetField] = value;
        }
      }
    }

    console.log('📊 Integration: Field updates from response:', updates);
    return updates;
  }

  /**
   * Extract value from response using dot notation or JSONPath
   */
  private extractValueFromPath(obj: any, path: string): any {
    if (!obj || !path) return undefined;

    // Handle $ as root
    if (path === '$') return obj;

    // Remove $ prefix if present
    const cleanPath = path.startsWith('$.') ? path.substring(2) : path;

    // Split path and traverse
    const parts = cleanPath.split('.');
    let current = obj;

    for (const part of parts) {
      // Handle array notation like items[0]
      const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, fieldName, index] = arrayMatch;
        current = current?.[fieldName]?.[parseInt(index)];
      } else {
        current = current?.[part];
      }

      if (current === undefined) {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Log integration call for debugging
   */
  private logIntegrationCall(log: IntegrationCallLog): void {
    this.integrationLogs.push(log);
    console.log('📝 Integration Log:', log);

    // Keep only last 50 logs in memory
    if (this.integrationLogs.length > 50) {
      this.integrationLogs.shift();
    }
  }

  /**
   * Get integration logs for debugging
   */
  getIntegrationLogs(): IntegrationCallLog[] {
    return [...this.integrationLogs];
  }

  /**
   * Clear integration logs
   */
  clearIntegrationLogs(): void {
    this.integrationLogs = [];
  }

  /**
   * Get integration endpoint from field integration
   */
  private getIntegrationEndpoint(integration: FieldIntegration): string {
    // The endpoint should be configured in the backend and included in the integration
    // For now, we'll construct it based on the integration type
    const baseUrl = this.configService.getBaseUrl();

    // This should come from the integration configuration in service flow
    // The backend should provide the full endpoint configuration
    if ((integration as any).endpoint) {
      return (integration as any).endpoint;
    }

    // Fallback - this should be removed once backend provides endpoint
    console.warn('⚠️ Integration: No endpoint found in integration config, using fallback');
    return `${baseUrl}/api/integration/${integration.integration_id}/`;
  }

  /**
   * Get integration headers from field integration
   */
  private getIntegrationHeaders(integration: FieldIntegration): any {
    const headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Add any custom headers from integration configuration
    if ((integration as any).headers) {
      Object.assign(headers, (integration as any).headers);
    }

    // Add authentication if configured
    if ((integration as any).authentication_type && (integration as any).auth_credentials) {
      switch ((integration as any).authentication_type) {
        case 'Bearer':
          headers['Authorization'] = `Bearer ${(integration as any).auth_credentials.token}`;
          break;
        case 'Basic':
          const basicAuth = btoa(`${(integration as any).auth_credentials.username}:${(integration as any).auth_credentials.password}`);
          headers['Authorization'] = `Basic ${basicAuth}`;
          break;
      }
    }

    return headers;
  }

  /**
   * Get HTTP method from integration
   */
  private getIntegrationMethod(integration: FieldIntegration): string {
    return (integration as any).method || 'GET';
  }
}
