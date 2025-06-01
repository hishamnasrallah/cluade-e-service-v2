// src/app/core/services/config.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private baseUrlSubject = new BehaviorSubject<string>('');
  public baseUrl$ = this.baseUrlSubject.asObservable();

  constructor() {
    const savedUrl = localStorage.getItem('baseUrl');
    if (savedUrl) {
      this.baseUrlSubject.next(savedUrl);
    }
  }

  setBaseUrl(url: string): void {
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    this.baseUrlSubject.next(cleanUrl);
    localStorage.setItem('baseUrl', cleanUrl);
  }

  getBaseUrl(): string {
    return this.baseUrlSubject.value;
  }
}
