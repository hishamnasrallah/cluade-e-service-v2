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
  private async executeIntegration(
    integration: FieldIntegration,
    field: ServiceFlowField,
    fieldValue: any,
    formData: { [key: string]: any }
  ): Promise<{ [key: string]: any } | null> {
    console.log(`🚀 Integration: Executing ${integration.integration_name}`);

    // Get the integration endpoint details from backend
    const integrationDetails = await this.getIntegrationDetails(integration.integration_id);
    if (!integrationDetails) {
      throw new Error('Integration details not found');
    }

    // Build the request
    const request = this.buildIntegrationRequest(
      integrationDetails,
      integration,
      fieldValue,
      formData
    );

    // Make the API call
    const startTime = Date.now();

    try {
      const response = await this.makeIntegrationCall(request, integrationDetails).toPromise();

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
   * Get integration details from backend
   */
  private async getIntegrationDetails(integrationId: number): Promise<any> {
    // In a real implementation, this would fetch from backend
    // For now, return a mock based on the documentation
    return {
      id: integrationId,
      endpoint: 'http://localhost:8001/api/citizens/{national_id}/',
      method: 'GET',
      path_param_mapping: { national_id: 'national_id' },
      headers: { 'Accept': 'application/json' },
      authentication_type: 'None',
      max_retries: 3,
      retry_delay: 60
    };
  }

  /**
   * Build the integration request
   */
  private buildIntegrationRequest(
    integrationDetails: any,
    fieldIntegration: FieldIntegration,
    fieldValue: any,
    formData: { [key: string]: any }
  ): any {
    let url = integrationDetails.endpoint;
    const headers = { ...integrationDetails.headers };
    let params = new HttpParams();
    let body = null;

    // Build path parameters
    const pathParams = {
      ...integrationDetails.path_param_mapping,
      ...fieldIntegration.path_param_mapping
    };

    for (const [placeholder, fieldName] of Object.entries(pathParams)) {
      const value = fieldName === 'field_value' ? fieldValue : formData[fieldName];
      url = url.replace(`{${placeholder}}`, encodeURIComponent(value));
    }

    // Build query parameters
    const queryParams = {
      ...integrationDetails.query_params,
      ...fieldIntegration.query_param_mapping
    };

    for (const [paramName, fieldName] of Object.entries(queryParams || {})) {
      const value = fieldName === 'field_value' ? fieldValue : formData[fieldName];
      if (value !== undefined && value !== null) {
        params = params.set(paramName, value);
      }
    }

    // Build request body for POST/PUT
    if (integrationDetails.method === 'POST' || integrationDetails.method === 'PUT') {
      body = { ...integrationDetails.request_body };

      if (fieldIntegration.payload_mapping) {
        for (const [bodyField, formField] of Object.entries(fieldIntegration.payload_mapping)) {
          const value = formField === 'field_value' ? fieldValue : formData[formField];
          body[bodyField] = value;
        }
      }
    }

    // Build headers
    if (fieldIntegration.header_mapping) {
      for (const [headerName, fieldName] of Object.entries(fieldIntegration.header_mapping)) {
        const value = fieldName === 'field_value' ? fieldValue : formData[fieldName];
        headers[headerName] = value;
      }
    }

    return { url, method: integrationDetails.method, headers, params, body };
  }

  /**
   * Make the actual integration API call
   */
  private makeIntegrationCall(request: any, integrationDetails: any): Observable<any> {
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

    // Add retry logic
    return httpCall.pipe(
      retry({
        count: integrationDetails.max_retries || 3,
        delay: (error, retryCount) => {
          console.log(`🔄 Integration: Retry attempt ${retryCount} after ${integrationDetails.retry_delay}s`);
          return of(error).pipe(delay((integrationDetails.retry_delay || 60) * 1000));
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
}
