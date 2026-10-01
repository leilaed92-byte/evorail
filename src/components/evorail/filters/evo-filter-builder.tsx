import {useMemo, useState} from 'react';
import {defaultOperators, type FilterField, type FilterRule, type FilterSchema} from './filter-schema';

const operatorLabels: Record<string, string> = {equals: 'est égal à', not_equals: 'est différent de', contains: 'contient', starts_with: 'commence par', in: 'est parmi', before: 'est avant', after: 'est après', is_true: 'est activé', is_false: 'est désactivé'};

export function EvoFilterBuilder({schema, onAdd}: {schema: FilterSchema; onAdd: (rule: FilterRule) => void}) {
  const [fieldId, setFieldId] = useState(schema.fields[0]?.id ?? '');
  const [operator, setOperator] = useState<FilterRule['operator']>(schema.fields[0]?.operators?.[0] ?? defaultOperators[schema.fields[0]?.type ?? 'text'][0]);
  const [value, setValue] = useState('');
  const field = useMemo<FilterField | undefined>(() => schema.fields.find(item => item.id === fieldId), [fieldId, schema.fields]);
  const operators = field?.operators ?? (field ? defaultOperators[field.type] : []);
  const add = () => { if (!fieldId || (field?.type !== 'boolean' && !value)) return; onAdd({id: `${fieldId}-${Date.now()}`, field: fieldId, operator, value: field?.type === 'boolean' ? operator === 'is_true' : value}); setValue(''); };
  return <details className="evo-filter-builder"><summary>Ajouter un filtre</summary><div className="evo-filter-builder-form"><label>Champ<select value={fieldId} onChange={event => {setFieldId(event.target.value); const next = schema.fields.find(item => item.id === event.target.value); setOperator(next?.operators?.[0] ?? defaultOperators[next?.type ?? 'text'][0]);}}>{schema.fields.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Opérateur<select value={operator} onChange={event => setOperator(event.target.value as FilterRule['operator'])}>{operators.map(item => <option key={item} value={item}>{operatorLabels[item] ?? item}</option>)}</select></label>{field?.type !== 'boolean' && <label>Valeur<input value={value} onChange={event => setValue(event.target.value)} /></label>}<button type="button" onClick={add}>Appliquer</button></div></details>;
}
