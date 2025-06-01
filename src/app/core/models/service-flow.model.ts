import {Category} from './category.model';

// src/app/core/models/service-flow.model.ts
export interface ServiceFlowStep {
  sequence_number: string;
  name: string;
  name_ara: string;
  description: string;
  description_ara: string;
  is_hidden_page: boolean;
  page_id: number;
  categories: Category[];
}

export interface ServiceFlowResponse {
  service_flow: ServiceFlowStep[];
}
