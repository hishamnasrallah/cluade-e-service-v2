import {Field} from './field.model';

export interface Category {
  id: number;
  name: string;
  name_ara: string;
  repeatable: boolean;
  fields: Field[];
}
