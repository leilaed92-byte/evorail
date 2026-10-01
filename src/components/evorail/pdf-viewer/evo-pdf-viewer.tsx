import {lazy, Suspense, useEffect, useState} from 'react';
import {EvoAsyncState} from '../foundation';

const EvoPdfViewerClient = lazy(() => import('./evo-pdf-viewer-client').then(module => ({default: module.EvoPdfViewerClient})));

export function EvoPdfViewer({source, fileName}: {source: Blob | string; fileName?: string}) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (typeof source === 'string') { setUrl(source); return; }
    const objectUrl = URL.createObjectURL(source);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [source]);
  if (!url) return <EvoAsyncState state="loading" message="Préparation de l’aperçu PDF…" />;
  return <Suspense fallback={<EvoAsyncState state="loading" message="Chargement du lecteur PDF…" />}><EvoPdfViewerClient source={url} fileName={fileName} /></Suspense>;
}
