// src/app/core/services/service-flow.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ServiceFlowResponse } from '../models/service-flow.model';

@Injectable({
  providedIn: 'root'
})
export class ServiceFlowService {
  constructor(private apiService: ApiService) {}

  getServiceFlow(serviceId: string): Observable<ServiceFlowResponse> {
    return this.apiService.get<ServiceFlowResponse>(`/dynamic/service_flow/?service=["${serviceId}"]`);
  }
}
