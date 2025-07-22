import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import {map, tap, catchError, shareReplay} from 'rxjs/operators';
import { ApiService } from './api.service';
import { LookupOption, LookupResponse } from '../models/interfaces';

export interface StatusInfo {
  id: number;
  name: string;
  name_ara: string | null;
  code: string;
  icon: string | null;
  color?: string;
  backgroundColor?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StatusService {
  private statusesSubject = new BehaviorSubject<StatusInfo[]>([]);
  public statuses$ = this.statusesSubject.asObservable();

  private statusMap = new Map<number, StatusInfo>();
  private statusByNameMap = new Map<string, StatusInfo>();
  private isLoaded = false;

  // Dynamic icon mapping based on common keywords in status names
  private getIconByKeywords(statusName: string): string {
    const nameLower = statusName.toLowerCase();

    if (nameLower.includes('draft')) return 'edit';
    if (nameLower.includes('submit')) return 'send';
    if (nameLower.includes('complet') || nameLower.includes('finish')) return 'check_circle';
    if (nameLower.includes('return')) return 'undo';
    if (nameLower.includes('pay') || nameLower.includes('payment')) return 'payment';
    if (nameLower.includes('print')) return 'print';
    if (nameLower.includes('deliver')) return 'local_shipping';
    if (nameLower.includes('process')) return 'hourglass_empty';
    if (nameLower.includes('approv')) return 'thumb_up';
    if (nameLower.includes('reject')) return 'thumb_down';
    if (nameLower.includes('pend') || nameLower.includes('wait')) return 'schedule';
    if (nameLower.includes('cancel')) return 'cancel';
    if (nameLower.includes('review')) return 'rate_review';
    if (nameLower.includes('new')) return 'fiber_new';

    return 'info'; // default icon
  }

  // Generate color based on status name hash
  private generateColorFromName(name: string): { color: string, backgroundColor: string } {
    // Use a hash function to generate consistent colors
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convert hash to HSL color
    const hue = Math.abs(hash % 360);
    const saturation = 65 + (Math.abs(hash % 20)); // 65-85%
    const lightness = 45 + (Math.abs(hash % 10)); // 45-55%

    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const backgroundColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.1)`;

    return { color, backgroundColor };
  }

  constructor(private apiService: ApiService) {}

  loadStatuses(): Observable<StatusInfo[]> {
    if (this.isLoaded) {
      return of(this.statusesSubject.value);
    }

    console.log('📋 StatusService: Loading statuses from API...');

    // Get the Status parent lookup first to find its ID
    return this.apiService.getLookupOptionsByName('Status').pipe(
      tap((response: LookupResponse) => {
        const statuses = this.mapLookupToStatuses(response.results || []);
        this.statusesSubject.next(statuses);

        // Build maps for quick lookup
        this.statusMap.clear();
        this.statusByNameMap.clear();

        statuses.forEach(status => {
          this.statusMap.set(status.id, status);
          this.statusByNameMap.set(status.name.toLowerCase(), status);
        });

        this.isLoaded = true;
        console.log('✅ StatusService: Loaded', statuses.length, 'statuses from API');
      }),
      map(() => this.statusesSubject.value),
      catchError(error => {
        console.error('❌ StatusService: Error loading statuses:', error);
        // Return empty array on error
        this.isLoaded = true; // Mark as loaded even on error to prevent infinite retries
        return of([]);
      })
    );
  }

  private mapLookupToStatuses(lookups: LookupOption[]): StatusInfo[] {
    return lookups.map(lookup => {
      const colorInfo = this.generateColorFromName(lookup.name);

      return {
        id: lookup.id,
        name: lookup.name,
        name_ara: lookup.name_ara,
        code: lookup.code,
        icon: lookup.icon || this.getIconByKeywords(lookup.name),
        color: colorInfo.color,
        backgroundColor: colorInfo.backgroundColor
      };
    });
  }

  getStatus(id: number): StatusInfo | null {
    return this.statusMap.get(id) || null;
  }

  getStatusByName(name: string): StatusInfo | null {
    return this.statusByNameMap.get(name.toLowerCase()) || null;
  }

  getStatusLabel(id: number): string {
    const status = this.getStatus(id);
    return status?.name || `Unknown Status (${id})`;
  }

  getStatusIcon(id: number): string {
    const status = this.getStatus(id);
    return status?.icon || 'help';
  }

  getStatusColor(id: number): string {
    const status = this.getStatus(id);
    return status?.color || '#3498db';
  }

  getStatusBackgroundColor(id: number): string {
    const status = this.getStatus(id);
    return status?.backgroundColor || 'rgba(52, 152, 219, 0.1)';
  }

  getAllStatuses(): StatusInfo[] {
    return Array.from(this.statusMap.values());
  }

  areStatusesLoaded(): boolean {
    return this.isLoaded;
  }
}
