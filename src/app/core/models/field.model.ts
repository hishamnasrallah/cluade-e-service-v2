
// src/app/core/models/field.model.ts
export interface VisibilityCondition {
  condition_logic: Array<{
    field: string;
    operation: string;
    value: any;
  }>;
}

export interface LookupOption {
  name: string;
  id: number;
  code: string;
  icon: string | null;
}

export interface Field {
  name: string;
  field_id: number;
  display_name: string;
  display_name_ara: string;
  field_type: 'text' | 'number' | 'boolean' | 'choice' | 'file' | 'decimal' | 'percentage';
  mandatory: boolean;
  lookup: number | null;
  allowed_lookups: LookupOption[];
  sub_fields: Field[];
  is_hidden: boolean;
  is_disabled: boolean;
  visibility_conditions: VisibilityCondition[];

  // Text field specific
  max_length?: number;
  min_length?: number;
  regex_pattern?: string;
  allowed_characters?: string;
  forbidden_words?: string;

  // Number field specific
  value_greater_than?: number;
  value_less_than?: number;
  integer_only?: boolean;
  positive_only?: boolean;
  precision?: number;

  // Boolean field specific
  default_boolean?: boolean;

  // Choice field specific
  max_selections?: number;
  min_selections?: number;

  // File field specific
  file_types?: string;
  max_file_size?: number;
  image_max_width?: number;
  image_max_height?: number;
}
