import {useState} from 'react';
import {Document, Page, pdfjs} from 'react-pdf';
import {EvoAsyncState} from '../foundation';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

export function EvoPdfViewerClient({source, fileName}: {source: string; fileName?: string}) {
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  return <div className="evo-pdf-viewer"><div className="evo-pdf-toolbar"><strong>{fileName ?? 'Aperçu PDF'}</strong>{pages > 0 && <div><button type="button" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page <= 1}>Précédent</button><span aria-live="polite">Page {page} / {pages}</span><button type="button" onClick={() => setPage(value => Math.min(pages, value + 1))} disabled={page >= pages}>Suivante</button></div>}</div><Document file={source} onLoadSuccess={({numPages}) => {setPages(numPages); setPage(1);}} loading={<EvoAsyncState state="loading" message="Chargement de l’aperçu PDF…" />} error={<EvoAsyncState state="error" message="Impossible de charger l’aperçu PDF." />}><Page pageNumber={page} renderTextLayer={false} renderAnnotationLayer={false} /></Document></div>;
}
