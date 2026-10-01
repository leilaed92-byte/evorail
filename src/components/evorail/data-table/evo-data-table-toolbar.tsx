import type {ReactNode} from 'react';

export function EvoDataTableToolbar({children, actions}: {children?: ReactNode; actions?: ReactNode}) {
  return <div className="evo-data-table-toolbar"><div>{children}</div>{actions && <div className="evo-data-table-toolbar-actions">{actions}</div>}</div>;
}
