import type {EvoPaginationState} from './evo-table-types';

export function EvoPagination({pagination, pageCount, onChange, total, label = 'Pagination du registre'}: {pagination: EvoPaginationState; pageCount?: number; onChange: (next: EvoPaginationState) => void; total?: number; label?: string}) {
  const pages = Math.max(pageCount ?? 1, 1);
  const current = pagination.pageIndex + 1;
  return <div className="evo-table-pagination"><span>{total === undefined ? `Page ${current} sur ${pages}` : `${total} enregistrement(s)`}</span><nav aria-label={label}><button type="button" aria-label="Page précédente" disabled={current <= 1} onClick={() => onChange({...pagination, pageIndex: pagination.pageIndex - 1})}>←</button><span aria-current="page">{current}</span><button type="button" aria-label="Page suivante" disabled={current >= pages} onClick={() => onChange({...pagination, pageIndex: pagination.pageIndex + 1})}>→</button></nav></div>;
}
