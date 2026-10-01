import type {FilterRule} from './filter-schema';

const encodeValue = (value: FilterRule['value']) => encodeURIComponent(Array.isArray(value) ? value.join(',') : String(value ?? ''));

export function serializeFilterRules(rules: FilterRule[]) {
  return rules.map(rule => `${encodeURIComponent(rule.field)}~${encodeURIComponent(rule.operator)}~${encodeValue(rule.value)}`).join('|');
}

export function parseFilterRules(value: string | null | undefined): FilterRule[] {
  if (!value) return [];
  return value.split('|').flatMap((part, index) => {
    const [field, operator, raw] = part.split('~');
    if (!field || !operator) return [];
    const decoded = decodeURIComponent(raw ?? '');
    return [{id: `${decodeURIComponent(field)}-${index}`, field: decodeURIComponent(field), operator: decodeURIComponent(operator) as FilterRule['operator'], value: decoded.includes(',') ? decoded.split(',') : decoded}];
  });
}

export function withFilterRules(url: string, rules: FilterRule[]) {
  const next = new URL(url, window.location.origin);
  const serialized = serializeFilterRules(rules);
  if (serialized) next.searchParams.set('filters', serialized); else next.searchParams.delete('filters');
  return `${next.pathname}${next.search}${next.hash}`;
}
