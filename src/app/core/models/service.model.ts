// src/app/core/models/service.model.ts
export interface Service {
  id: number;
  parent_lookup: number;
  type: number;
  name: string;
  name_ara: string;
  code: string;
  icon: string | null;
  active_ind: boolean;
}

export interface ServicesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Service[];
}
