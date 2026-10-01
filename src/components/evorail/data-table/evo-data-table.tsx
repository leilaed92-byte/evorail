import {useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode} from 'react';
import {ChevronDown, ChevronUp, ChevronsUpDown} from 'lucide-react';
import {flexRender, useTable} from '@tanstack/react-table';
import type {ColumnDef, Table} from '@tanstack/react-table';
import {EvoColumnVisibility} from './evo-column-visibility';
import {EvoPagination} from './evo-pagination';
import {evoTableFeatures, type EvoColumnDef, type EvoPaginationState, type EvoRowSelectionState, type EvoSortingState, type EvoUpdater, type EvoVisibilityState, type EvoTableFeatures} from './evo-table-types';

function resolveUpdater<T>(updater: EvoUpdater<T>, current: T): T {
  return typeof updater === 'function' ? (updater as (value: T) => T)(current) : updater;
}

function SelectionCheckbox({checked, indeterminate, label, onChange}: {checked: boolean; indeterminate?: boolean; label: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = Boolean(indeterminate); }, [indeterminate]);
  return <input ref={ref} type="checkbox" aria-label={label} checked={checked} onChange={onChange} />;
}

function SortIndicator({table, columnId}: {table: Table<EvoTableFeatures, object>; columnId: string}) {
  const column = table.getColumn(columnId);
  if (!column?.getCanSort()) return null;
  const sorted = column.getIsSorted();
  return sorted === 'asc' ? <ChevronUp size={14} aria-label="Trié par ordre croissant" /> : sorted === 'desc' ? <ChevronDown size={14} aria-label="Trié par ordre décroissant" /> : <ChevronsUpDown size={14} aria-label="Trier" />;
}

export type EvoDataTableProps<TData extends object> = {
  data: ReadonlyArray<TData>;
  columns: ReadonlyArray<EvoColumnDef<TData>>;
  idKey: keyof TData;
  empty?: ReactNode;
  loading?: boolean;
  error?: ReactNode;
  density?: 'compact' | 'comfortable';
  enableRowSelection?: boolean;
  selectionLabel?: (row: TData) => string;
  rowSelection?: EvoRowSelectionState;
  onRowSelectionChange?: (selection: EvoRowSelectionState) => void;
  sorting?: EvoSortingState;
  onSortingChange?: (sorting: EvoSortingState) => void;
  pagination?: EvoPaginationState;
  pageCount?: number;
  total?: number;
  onPaginationChange?: (pagination: EvoPaginationState) => void;
  columnVisibility?: EvoVisibilityState;
  onColumnVisibilityChange?: (visibility: EvoVisibilityState) => void;
  enableColumnVisibility?: boolean;
  manualSorting?: boolean;
  manualPagination?: boolean;
  stickyHeader?: boolean;
  onRowClick?: (row: TData) => void;
};

export function EvoDataTable<TData extends object>({data, columns, idKey, empty, loading = false, error, density = 'compact', enableRowSelection = false, selectionLabel = row => `Sélectionner ${String(row[idKey])}`, rowSelection, onRowSelectionChange, sorting, onSortingChange, pagination, pageCount = 1, total, onPaginationChange, columnVisibility, onColumnVisibilityChange, enableColumnVisibility = false, manualSorting = true, manualPagination = true, stickyHeader = true, onRowClick}: EvoDataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = useState<EvoSortingState>([]);
  const [internalPagination, setInternalPagination] = useState<EvoPaginationState>({pageIndex: 0, pageSize: 25});
  const [internalSelection, setInternalSelection] = useState<EvoRowSelectionState>({});
  const [internalVisibility, setInternalVisibility] = useState<EvoVisibilityState>({});
  const currentSorting = sorting ?? internalSorting;
  const currentPagination = pagination ?? internalPagination;
  const currentSelection = rowSelection ?? internalSelection;
  const currentVisibility = columnVisibility ?? internalVisibility;
  const tableColumns = useMemo<ReadonlyArray<ColumnDef<EvoTableFeatures, TData>>>(() => {
    if (!enableRowSelection) return columns;
    const selectionColumn: EvoColumnDef<TData> = {
      id: '__selection',
      enableHiding: false,
      enableSorting: false,
      header: ({table}) => <SelectionCheckbox checked={table.getIsAllPageRowsSelected()} indeterminate={table.getIsSomePageRowsSelected()} label="Sélectionner toutes les lignes" onChange={table.getToggleAllPageRowsSelectedHandler()} />,
      cell: ({row}) => <SelectionCheckbox checked={row.getIsSelected()} label={selectionLabel(row.original)} onChange={row.getToggleSelectedHandler()} />,
      size: 44,
    };
    return [selectionColumn, ...columns];
  }, [columns, enableRowSelection, selectionLabel]);
  const table = useTable({
    key: 'evorail-data-table',
    features: evoTableFeatures,
    data,
    columns: tableColumns,
    getRowId: row => String(row[idKey]),
    state: {sorting: currentSorting, pagination: currentPagination, rowSelection: currentSelection, columnVisibility: currentVisibility},
    onSortingChange: updater => { const next = resolveUpdater(updater, currentSorting); if (!sorting) setInternalSorting(next); onSortingChange?.(next); },
    onRowSelectionChange: updater => { const next = resolveUpdater(updater, currentSelection); if (!rowSelection) setInternalSelection(next); onRowSelectionChange?.(next); },
    onColumnVisibilityChange: updater => { const next = resolveUpdater(updater, currentVisibility); if (!columnVisibility) setInternalVisibility(next); onColumnVisibilityChange?.(next); },
    manualSorting,
    manualPagination,
    pageCount,
  });
  const tableState = loading ? <div className="evo-table-state" role="status">Chargement du registre…</div> : error ? <div className="evo-table-state evo-table-state-error" role="alert">{error}</div> : data.length === 0 ? <>{empty ?? <div className="evo-table-state">Aucun enregistrement.</div>}</> : null;
  return <div className={`evo-data-table evo-data-table-${density}${stickyHeader ? ' evo-data-table-sticky' : ''}`}>{enableColumnVisibility && <div className="evo-table-toolbar-inline"><EvoColumnVisibility table={table} /></div>}{tableState ?? <div className="evo-table-scroll"><table><thead>{table.getHeaderGroups().map(headerGroup => <tr key={headerGroup.id}>{headerGroup.headers.map(header => <th key={header.id} style={header.getSize() ? {width: header.getSize()} : undefined}>{header.isPlaceholder ? null : <button type="button" className="evo-table-sort" onClick={header.column.getToggleSortingHandler()} aria-disabled={!header.column.getCanSort()}>{flexRender(header.column.columnDef.header, header.getContext())}{header.column.getCanSort() && <SortIndicator table={table as unknown as Table<EvoTableFeatures, object>} columnId={header.column.id} />}</button>}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map(row => <tr key={row.id} className={onRowClick ? 'is-clickable' : undefined} onClick={() => onRowClick?.(row.original)}>{row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div>}{onPaginationChange && <EvoPagination pagination={currentPagination} pageCount={pageCount} total={total} onChange={next => { if (!pagination) setInternalPagination(next); onPaginationChange(next); }} />}</div>;
}
