import type {ReactNode} from 'react';

export function EvoBulkActionBar({count, children}: {count: number; children: ReactNode}) {
  if (count === 0) return null;
  return <div className="evo-bulk-action-bar" role="region" aria-label="Actions groupées"><span><strong>{count}</strong> sélectionné(s)</span><div>{children}</div></div>;
}
