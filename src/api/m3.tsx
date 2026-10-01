import {useEffect, useState} from 'react';
import {apiErrorMessage, evoRailApi, type ApiRevision, type DocumentFilters} from './evoRailApi';

export function readRegisterState(search: string): DocumentFilters {
  const params = new URLSearchParams(search);
  const filters: DocumentFilters = {};
  for (const key of ['search', 'workflow_status', 'suitability', 'effective_state', 'discipline', 'revision', 'sort'] as const) {
    if (params.has(key)) filters[key] = params.get(key)!;
  }
  if (params.has('current_only')) filters.current_only = ['1', 'true'].includes(params.get('current_only')!);
  filters.page = Math.max(1, Number(params.get('page')) || 1);
  filters.per_page = Math.min(100, Math.max(1, Number(params.get('per_page')) || 25));
  return filters;
}

export function useUrlSearch() {
  const [search, setSearch] = useState(window.location.search);
  useEffect(() => {
    const changed = () => setSearch(window.location.search);
    window.addEventListener('popstate', changed);
    return () => window.removeEventListener('popstate', changed);
  }, []);
  return [new URLSearchParams(search), (values: Record<string, string | undefined>) => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined || value === '') params.delete(key); else params.set(key, value);
    }
    window.history.pushState({}, '', `${window.location.pathname}?${params}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }] as const;
}

export async function downloadRevision(revision: ApiRevision) {
  const blob = await evoRailApi.file('download', revision.id);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = revision.file?.original_filename ?? `revision-${revision.revision_code}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ProtectedPreview({revision}: {revision: ApiRevision | null}) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const mime = revision?.file?.mime_type;
  const supported = mime === 'application/pdf' || ['image/jpeg', 'image/png', 'image/tiff'].includes(mime ?? '');
  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';
    setUrl(''); setError(''); setLoading(false);
    if (!revision?.file || !supported) return;
    setLoading(true);
    void evoRailApi.file('preview', revision.id).then(blob => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob); setUrl(objectUrl);
    }).catch(cause => {if (!cancelled) setError(apiErrorMessage(cause));})
      .finally(() => {if (!cancelled) setLoading(false);});
    return () => {cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl);};
  }, [revision?.id, mime, supported]);
  return <div className="preview-surface">
    {loading && <span role="status">Chargement de l’aperçu…</span>}
    {error && <span role="alert">{error}</span>}
    {!revision?.file && <span>Fichier manquant.</span>}
    {revision?.file && !supported && <span>Aperçu CAD / format non pris en charge. Téléchargez le fichier source.</span>}
    {url && (mime === 'application/pdf' ? <iframe title="Aperçu protégé de la révision" src={url} /> : <img alt={`Révision ${revision?.revision_code}`} src={url} style={{maxWidth: '100%'}} />)}
    <strong>{revision?.file?.original_filename ?? 'Aperçu indisponible'}</strong>
    {revision?.file && <button className="text-button" onClick={() => {void downloadRevision(revision).catch(cause => setError(apiErrorMessage(cause)));}}>Télécharger le fichier source</button>}
  </div>;
}
