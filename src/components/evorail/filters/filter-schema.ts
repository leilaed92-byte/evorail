export type FilterFieldType = 'text' | 'select' | 'date' | 'boolean';
export type FilterOperator = 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'in' | 'before' | 'after' | 'is_true' | 'is_false';

export type FilterOption = {value: string; label: string};
export type FilterField = {id: string; label: string; type: FilterFieldType; operators?: FilterOperator[]; options?: FilterOption[]};
export type FilterRule = {id: string; field: string; operator: FilterOperator; value?: string | string[] | boolean};
export type FilterSchema = {fields: FilterField[]};

export const defaultOperators: Record<FilterFieldType, FilterOperator[]> = {
  text: ['contains', 'equals', 'starts_with'],
  select: ['equals', 'not_equals'],
  date: ['before', 'after', 'equals'],
  boolean: ['is_true', 'is_false'],
};

export function fieldForRule(schema: FilterSchema, rule: FilterRule) {
  return schema.fields.find(field => field.id === rule.field);
}
