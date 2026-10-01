import {useId} from 'react';
import type {Table} from '@tanstack/react-table';
import type {EvoTableFeatures} from './evo-table-types';

export function EvoColumnVisibility<TData extends object>({table}: {table: Table<EvoTableFeatures, TData>}) {
  const id = useId();
  const columns = table.getAllLeafColumns().filter(column => column.getCanHide());
  if (columns.length === 0) return null;
  return <details className="evo-column-visibility"><summary aria-controls={id}>Colonnes</summary><div id={id} className="evo-column-visibility-menu">{columns.map(column => <label key={column.id}><input type="checkbox" checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} />{typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}</label>)}</div></details>;
}
