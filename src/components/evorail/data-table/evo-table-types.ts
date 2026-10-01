import {columnSizingFeature, columnVisibilityFeature, rowPaginationFeature, rowPinningFeature, rowSelectionFeature, rowSortingFeature, tableFeatures} from '@tanstack/react-table';
import type {ColumnDef, ColumnVisibilityState, PaginationState, RowSelectionState, SortingState, Updater} from '@tanstack/react-table';

export const evoTableFeatures = tableFeatures({
  columnVisibilityFeature,
  columnSizingFeature,
  rowPaginationFeature,
  rowPinningFeature,
  rowSelectionFeature,
  rowSortingFeature,
});

export type EvoTableFeatures = typeof evoTableFeatures;
export type EvoColumnDef<TData extends object> = ColumnDef<EvoTableFeatures, TData>;
export type EvoSortingState = SortingState;
export type EvoPaginationState = PaginationState;
export type EvoRowSelectionState = RowSelectionState;
export type EvoVisibilityState = ColumnVisibilityState;
export type EvoUpdater<T> = Updater<T>;
