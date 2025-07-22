import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, tap, switchMap, shareReplay } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  LookupOption,
  LookupResponse,
  ServicesResponse,
  Service
} from '../models/interfaces';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

@Injectable({
  providedIn: 'root'
})
export class LookupCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private activeRequests = new Map<string, Observable<any>>();

  // Default TTL: 1 hour for lookups (they rarely change)
  private readonly DEFAULT_TTL = 60 * 60 * 1000;

  // Services cache with longer TTL (24 hours)
  private servicesCache$ = new BehaviorSubject<Service[] | null>(null);
  private readonly SERVICES_TTL = 24 * 60 * 60 * 1000;

  constructor(private apiService: ApiService) {
    console.log('🗄️ LookupCacheService: Initialized');
  }

  /**
   * Get lookup options with caching
   */
  getLookupOptions(parentLookupId: number): Observable<LookupOption[]> {
    const cacheKey = `lookup_${parentLookupId}`;

    // Check if we have valid cached data
    const cached = this.getFromCache<LookupOption[]>(cacheKey);
    if (cached) {
      console.log(`✅ LookupCache: Returning cached data for lookup ${parentLookupId}`);
      return of(cached);
    }

    // Check if there's already an active request
    const activeRequest = this.activeRequests.get(cacheKey);
    if (activeRequest) {
      console.log(`⏳ LookupCache: Returning existing request for lookup ${parentLookupId}`);
      return activeRequest;
    }

    // Make new request
    console.log(`🔄 LookupCache: Fetching fresh data for lookup ${parentLookupId}`);
    const request$ = this.apiService.getLookupOptions(parentLookupId).pipe(
      map((response: LookupResponse) => response.results || []),
      tap(data => {
        this.setCache(cacheKey, data);
        this.activeRequests.delete(cacheKey);
      }),
      shareReplay(1)
    );

    this.activeRequests.set(cacheKey, request$);
    return request$;
  }

  /**
   * Get lookup options by name with caching
   */
  getLookupOptionsByName(parentLookupName: string): Observable<LookupOption[]> {
    const cacheKey = `lookup_name_${parentLookupName}`;

    const cached = this.getFromCache<LookupOption[]>(cacheKey);
    if (cached) {
      console.log(`✅ LookupCache: Returning cached data for lookup name "${parentLookupName}"`);
      return of(cached);
    }

    const activeRequest = this.activeRequests.get(cacheKey);
    if (activeRequest) {
      console.log(`⏳ LookupCache: Returning existing request for lookup name "${parentLookupName}"`);
      return activeRequest;
    }

    console.log(`🔄 LookupCache: Fetching fresh data for lookup name "${parentLookupName}"`);
    const request$ = this.apiService.getLookupOptionsByName(parentLookupName).pipe(
      map((response: LookupResponse) => response.results || []),
      tap(data => {
        this.setCache(cacheKey, data);
        this.activeRequests.delete(cacheKey);
      }),
      shareReplay(1)
    );

    this.activeRequests.set(cacheKey, request$);
    return request$;
  }

  /**
   * Get all services with caching
   */
  getServices(): Observable<Service[]> {
    // Check if we have cached services
    if (this.servicesCache$.value) {
      const cacheKey = 'services_all';
      const cached = this.getFromCache<Service[]>(cacheKey, this.SERVICES_TTL);
      if (cached) {
        console.log('✅ LookupCache: Returning cached services');
        return of(cached);
      }
    }

    // Check for active request
    const activeRequest = this.activeRequests.get('services_all');
    if (activeRequest) {
      console.log('⏳ LookupCache: Returning existing services request');
      return activeRequest;
    }

    console.log('🔄 LookupCache: Fetching fresh services data');
    const request$ = this.apiService.getServices().pipe(
      map((response: ServicesResponse) => response.results || []),
      tap(data => {
        this.setCache('services_all', data, this.SERVICES_TTL);
        this.servicesCache$.next(data);
        this.activeRequests.delete('services_all');
      }),
      shareReplay(1)
    );

    this.activeRequests.set('services_all', request$);
    return request$;
  }

  /**
   * Get service by ID from cache
   */
  getServiceById(serviceId: number): Observable<Service | null> {
    return this.getServices().pipe(
      map(services => services.find(s => s.id === serviceId) || null)
    );
  }

  /**
   * Get service code from case type (with caching)
   */
  getServiceCodeFromCaseType(caseType: number): Observable<string> {
    return this.getServiceById(caseType).pipe(
      map(service => service?.code || '01')
    );
  }

  /**
   * Clear specific cache entry
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      console.log(`🗑️ LookupCache: Cleared cache for key "${key}"`);
    } else {
      this.cache.clear();
      this.servicesCache$.next(null);
      console.log('🗑️ LookupCache: Cleared all cache');
    }
  }

  /**
   * Get from cache if valid
   */
  private getFromCache<T>(key: string, customTtl?: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const ttl = customTtl || entry.ttl;
    const age = Date.now() - entry.timestamp;

    if (age > ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache entry
   */
  private setCache<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
}
