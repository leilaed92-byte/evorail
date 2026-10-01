import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {EvoAsyncState, EvoDataTable, EvoFilterBuilder, parseFilterRules, serializeFilterRules, type EvoColumnDef, type FilterSchema} from '../../src/components/evorail';

type Row = {id: string; name: string};
const columns: EvoColumnDef<Row>[] = [{accessorKey: 'name', header: 'Nom'}];

describe('EvoRail component contracts', () => {
  it('uses TanStack selection state without exposing column controls by default', () => {
    const onSelection = vi.fn();
    render(<EvoDataTable data={[{id: 'one', name: 'Alpha'}]} columns={columns} idKey="id" enableRowSelection onRowSelectionChange={onSelection} />);
    expect(screen.queryByText('Colonnes')).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', {name: 'Sélectionner one'}));
    expect(onSelection).toHaveBeenCalledWith({one: true});
  });

  it('round-trips deterministic filter state for URL persistence', () => {
    const rules = [{id: 'status-0', field: 'status', operator: 'equals' as const, value: 'issued'}];
    expect(parseFilterRules(serializeFilterRules(rules))).toMatchObject([{field: 'status', operator: 'equals', value: 'issued'}]);
  });

  it('adds a schema-driven filter and exposes explicit async states', () => {
    const schema: FilterSchema = {fields: [{id: 'status', label: 'Statut', type: 'select', options: [{value: 'issued', label: 'Émis'}]}]};
    const onAdd = vi.fn();
    render(<><EvoFilterBuilder schema={schema} onAdd={onAdd} /><EvoAsyncState state="backend-unavailable" /><EvoAsyncState state="not-found" /></>);
    fireEvent.click(screen.getByText('Ajouter un filtre'));
    fireEvent.change(screen.getByLabelText('Valeur'), {target: {value: 'issued'}});
    fireEvent.click(screen.getByRole('button', {name: 'Appliquer'}));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({field: 'status', value: 'issued'}));
    expect(screen.getByText('Serveur indisponible')).toBeInTheDocument();
    expect(screen.getByText('Enregistrement introuvable')).toBeInTheDocument();
  });
});
