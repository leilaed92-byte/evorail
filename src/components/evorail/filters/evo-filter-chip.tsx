import type {FilterField, FilterRule} from './filter-schema';

export function EvoFilterChip({rule, field, onRemove}: {rule: FilterRule; field?: FilterField; onRemove: () => void}) {
  const value = Array.isArray(rule.value) ? rule.value.join(', ') : String(rule.value ?? '');
  return <button type="button" className="evo-filter-chip" onClick={onRemove} aria-label={`Retirer le filtre ${field?.label ?? rule.field}`}><span>{field?.label ?? rule.field}: {value}</span><span aria-hidden="true">×</span></button>;
}
