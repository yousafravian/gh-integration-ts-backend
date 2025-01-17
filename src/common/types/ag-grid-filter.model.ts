export interface BaseFilterModel {
  filterType: string; // e.g., 'text', 'number', 'date', etc.
}

export interface TextFilterModel extends BaseFilterModel {
  filterType: 'text';
  type: 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'equals' | 'notEqual';
  filter: string;
  filterTo?: string; // For some filter types
}

export interface NumberFilterModel extends BaseFilterModel {
  filterType: 'number';
  type:
    | 'equals'
    | 'notEqual'
    | 'lessThan'
    | 'greaterThan'
    | 'lessThanOrEqual'
    | 'greaterThanOrEqual'
    | 'inRange';
  filter: number;
  filterTo?: number; // Required for 'inRange'
}

export interface DateFilterModel extends BaseFilterModel {
  filterType: 'date';
  type: 'equals' | 'notEqual' | 'lessThan' | 'greaterThan' | 'inRange';
  dateFrom: string; // ISO string
  dateTo?: string; // Required for 'inRange'
}

export interface BooleanFilterModel extends BaseFilterModel {
  filterType: 'boolean';
  type: 'boolean';
  filter: boolean;
}

export interface CustomFilterModel extends BaseFilterModel {
  filterType: 'custom';
  type: 'custom';
  customProperty: any; // Define as needed
}

export interface MultiFilterModel extends BaseFilterModel {
  filterType: 'multi';
  type: 'multi';
  operator: 'AND' | 'OR';
  condition1: FilterModel;
  condition2: FilterModel;
  // Additional conditions if necessary
}

export type FilterModel =
  | TextFilterModel
  | NumberFilterModel
  | DateFilterModel
  | BooleanFilterModel
  | CustomFilterModel
  | MultiFilterModel;

export interface AGGridFilterModel {
  [colId: string]: FilterModel;
}