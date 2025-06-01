
// src/app/core/models/case.model.ts
export interface CaseData {
  [key: string]: any;
  uploaded_files?: Array<{
    file_url: string;
    type: string;
  }>;
}

export interface Case {
  id: number;
  applicant: number;
  applicant_type: number;
  case_type: number;
  status: number;
  sub_status: number | null;
  assigned_group: number | null;
  assigned_emp: number | null;
  current_approval_step: number;
  last_action: number | null;
  created_by: number;
  updated_by: number;
  case_data: CaseData;
  serial_number: string;
  created_at: string;
  updated_at: string;
}

export interface CasesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Case[];
}
