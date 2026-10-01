import type {ReactNode} from 'react';
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {EvoDataTable} from './data-table';

export type EvoState = 'loading' | 'refreshing' | 'empty' | 'no-results' | 'error' | 'generic-error' | 'backend-unavailable' | 'not-found' | 'validation-failure' | 'forbidden' | 'unauthorized' | 'offline';

const stateCopy: Record<Exclude<EvoState, 'refreshing'>, {title: string; body: string}> = {
  loading: {title: 'Chargement', body: 'Les enregistrements contrôlés sont en cours de chargement.'},
  empty: {title: 'Aucun enregistrement', body: 'Aucune donnée contrôlée n’est disponible dans ce projet.'},
  'no-results': {title: 'Aucun résultat', body: 'Aucun enregistrement ne correspond aux filtres actifs.'},
  error: {title: 'Chargement impossible', body: 'EvoRail n’a pas pu charger cette surface.'},
  'generic-error': {title: 'Une erreur est survenue', body: 'Cette action n’a pas pu être terminée.'},
  'backend-unavailable': {title: 'Serveur indisponible', body: 'Le service EvoRail ne répond pas actuellement.'},
  'not-found': {title: 'Enregistrement introuvable', body: 'La ressource demandée n’existe pas ou n’est plus accessible.'},
  'validation-failure': {title: 'Vérifiez les informations', body: 'Certains champs doivent être corrigés avant de continuer.'},
  forbidden: {title: 'Accès refusé', body: 'Votre rôle ne permet pas d’accéder à ces enregistrements.'},
  unauthorized: {title: 'Session requise', body: 'Reconnectez-vous pour accéder aux données du projet.'},
  offline: {title: 'Serveur indisponible', body: 'La connexion à EvoRail est indisponible. Les données ne sont pas remplacées par des exemples.'},
};

export function EvoAsyncState({state, title, message, onRetry}: {state: EvoState; title?: string; message?: string; onRetry?: () => void}) {
  if (state === 'refreshing') return <div className="evo-state evo-state-refreshing" role="status"><span className="evo-state-spinner" aria-hidden="true" />Actualisation…</div>;
  const copy = stateCopy[state];
  return <div className={`evo-state evo-state-${state}`} role={state === 'error' || state === 'generic-error' || state === 'backend-unavailable' || state === 'forbidden' || state === 'unauthorized' || state === 'offline' || state === 'not-found' || state === 'validation-failure' ? 'alert' : 'status'}><div className="evo-state-mark" aria-hidden="true">{state === 'loading' ? '…' : state === 'empty' || state === 'no-results' || state === 'not-found' ? '∅' : '!'}</div><div><strong>{title ?? copy.title}</strong><p>{message ?? copy.body}</p>{onRetry && <Button label="Réessayer" size="sm" variant="secondary" onClick={onRetry} />}</div></div>;
}

export function EvoStatusBadge({status, label}: {status?: string; label?: string}) {
  const value = status ?? 'unknown';
  const variant = value === 'issued' || value === 'approved' || value === 'completed' || value === 'current' ? 'success' : value === 'rejected' || value === 'returned' || value === 'cancelled' ? 'error' : value === 'in_progress' || value === 'pending' || value === 'under_review' ? 'warning' : 'neutral';
  return <Badge label={label ?? value.replaceAll('_', ' ')} variant={variant} />;
}

export function EvoRevisionBadge({code, exact = true}: {code?: string | null; exact?: boolean}) {
  return <span className={`evo-revision-badge${exact ? ' is-exact' : ''}`} title={exact ? 'Révision exacte' : 'Révision'}>{exact ? 'Rev ' : ''}{code ?? '—'}</span>;
}

export function EvoPageHeader({eyebrow, title, subtitle, actions}: {eyebrow?: string; title: string; subtitle?: ReactNode; actions?: ReactNode}) {
  return <header className="evo-page-header"><div><div className="evo-eyebrow">{eyebrow}</div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{actions && <div className="evo-page-actions">{actions}</div>}</header>;
}

export function EvoFilterBar({children, chips = [], onClear}: {children?: ReactNode; chips?: Array<{id: string; label: string; onRemove?: () => void}>; onClear?: () => void}) {
  return <section className="evo-filter-bar" aria-label="Filtres du registre"><div className="evo-filter-controls">{children}</div>{chips.length > 0 && <div className="evo-filter-chips">{chips.map(chip => <button type="button" className="evo-filter-chip" key={chip.id} onClick={chip.onRemove}><span>{chip.label}</span><span aria-hidden="true">×</span></button>)}{onClear && <button type="button" className="evo-filter-clear" onClick={onClear}>Effacer</button>}</div>}</section>;
}

export {EvoDataTable};

export function EvoDetailPanel({title, eyebrow, children, actions}: {title: string; eyebrow?: string; children: ReactNode; actions?: ReactNode}) {
  return <Card variant="default" padding={4} className="evo-detail-panel"><div className="evo-panel-header"><div><div className="evo-eyebrow">{eyebrow}</div><h2>{title}</h2></div>{actions && <div className="evo-panel-actions">{actions}</div>}</div>{children}</Card>;
}

export function EvoTimeline({items, empty = 'Aucune activité.'}: {items: Array<{id: string; title: string; detail?: ReactNode; date?: string}>; empty?: ReactNode}) {
  return <div className="evo-timeline">{items.length === 0 ? <p className="evo-timeline-empty">{empty}</p> : items.map((item, index) => <div className="evo-timeline-item" key={item.id}><span className="evo-timeline-marker" aria-hidden="true">{index + 1}</span><div><strong>{item.title}</strong>{item.detail && <span>{item.detail}</span>}{item.date && <time>{item.date}</time>}</div></div>)}</div>;
}

export function EvoReadOnlyBanner({children}: {children: ReactNode}) {
  return <div className="evo-readonly-banner" role="status"><strong>Lecture seule</strong><span>{children}</span></div>;
}
