// src/app/core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  private getMultipartHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  get<T>(endpoint: string): Observable<T> {
    const url = `${this.configService.getBaseUrl()}${endpoint}`;
    return this.http.get<T>(url, { headers: this.getHeaders() });
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.configService.getBaseUrl()}${endpoint}`;
    return this.http.post<T>(url, data, { headers: this.getHeaders() });
  }

  postFormData<T>(endpoint: string, formData: FormData): Observable<T> {
    const url = `${this.configService.getBaseUrl()}${endpoint}`;
    return this.http.post<T>(url, formData, { headers: this.getMultipartHeaders() });
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.configService.getBaseUrl()}${endpoint}`;
    return this.http.put<T>(url, data, { headers: this.getHeaders() });
  }

  delete<T>(endpoint: string): Observable<T> {
    const url = `${this.configService.getBaseUrl()}${endpoint}`;
    return this.http.delete<T>(url, { headers: this.getHeaders() });
  }
}
