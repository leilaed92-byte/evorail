import {lazy, Suspense, useEffect, useMemo, useState, type ReactNode} from 'react';
import {AppShell} from '@astryxdesign/core/AppShell';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {CommandPalette} from '@astryxdesign/core/CommandPalette';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {MoreMenu} from '@astryxdesign/core/MoreMenu';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {TextInput} from '@astryxdesign/core/TextInput';
import {TopNav} from '@astryxdesign/core/TopNav';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Tab, TabList} from '@astryxdesign/core/TabList';
import {createStaticSource} from '@astryxdesign/core/Typeahead';
import {Theme, defineTheme} from '@astryxdesign/core/theme';
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  BellIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  CircleStackIcon,
  ClockIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  FunnelIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  ShareIcon,
  ShieldCheckIcon,
  SunIcon,
  UsersIcon,
  ViewColumnsIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {navigateInProject, projectHref, projectPathname} from './api/projectLocation';
import {canNavigate} from './api/permissions';
import {AppSidebar} from './components/app-sidebar/app-sidebar';
import {EvoRailProvider, useEvoRail} from './api/EvoRailProvider';
import type {ApiDocument} from './api/evoRailApi';
import {apiErrorMessage, evoRailApi, type ApiRevision, type RevisionComparison, type Pagination} from './api/evoRailApi';

import {downloadRevision, ProtectedPreview, readRegisterState, useUrlSearch} from './api/m3';
import {EvoAsyncState, EvoBulkActionBar, EvoDataTable, EvoDetailPanel, EvoFilterBuilder, EvoFilterChip, EvoPageHeader, EvoToaster, type EvoColumnDef, type EvoRowSelectionState, type FilterRule, type FilterSchema} from './components/evorail';

const ReviewsPage = lazy(() => import('./m4').then(module => ({default: module.ReviewsPage})));
const ReviewDetail = lazy(() => import('./m4').then(module => ({default: module.ReviewDetail})));
const ApprovalsPage = lazy(() => import('./m4').then(module => ({default: module.ApprovalsPage})));
const ApprovalDetail = lazy(() => import('./m4').then(module => ({default: module.ApprovalDetail})));
const MyWorkPage = lazy(() => import('./m4').then(module => ({default: module.MyWorkPage})));
const TransmissionsPage = lazy(() => import('./m5').then(module => ({default: module.TransmissionsPage})));
const TransmissionDetailPage = lazy(() => import('./m5').then(module => ({default: module.TransmissionDetailPage})));
const TransmissionComposer = lazy(() => import('./m5').then(module => ({default: module.TransmissionComposer})));

type StatusKind = 'current' | 'review' | 'returned' | 'draft' | 'ifc' | 'overdue';

type DocumentRow = {
  id: string;
  backendId: string;
  currentRevisionId: string | null;
  title: string;
  type: string;
  discipline: string;
  revision: string;
  status: StatusKind;
  statusLabel: string;
  suitability: string;
  owner: string;
  due: string;
  updated: string;
  overdue?: boolean;
};

const documentFilterSchema: FilterSchema = {fields: [
  {id: 'workflow_status', label: 'Workflow', type: 'select'},
  {id: 'suitability', label: 'Adéquation', type: 'select'},
  {id: 'effective_state', label: 'État d’effet', type: 'select'},
  {id: 'discipline', label: 'Discipline', type: 'text'},
  {id: 'revision', label: 'Révision', type: 'text'},
]};

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', {day: '2-digit', month: 'short', year: 'numeric'}).format(new Date(value));
}

function statusFromApi(document: ApiDocument): {status: StatusKind; label: string} {
  if (document.effective_state === 'current') return {status: 'current', label: 'Actuel'};
  if (document.workflow_status === 'returned') return {status: 'returned', label: 'Retourné'};
  if (document.workflow_status === 'draft') return {status: 'draft', label: 'Brouillon'};
  if (document.suitability_status === 'issued_for_construction') return {status: 'ifc', label: 'Émis pour construction'};
  return {status: 'review', label: 'En revue'};
}

function suitabilityLabel(value: string) {
  return {
    for_information: 'Pour information',
    for_review: 'Pour revue',
    for_approval: 'Pour approbation',
    approved: 'Approuvé',
    issued_for_construction: 'IFC',
    as_built: 'Tel que construit',
  }[value] ?? value;
}

function apiDocumentToRow(document: ApiDocument): DocumentRow {
  const status = statusFromApi(document);
  const typeSegment = document.document_number.split('-')[3] ?? 'DOC';
  return {
    id: document.document_number,
    backendId: document.id,
    currentRevisionId: document.current_revision_id,
    title: document.title,
    type: typeSegment === 'DWG' ? 'Plan' : typeSegment === 'CAL' ? 'Note de calcul' : typeSegment === 'RPT' ? 'Rapport' : 'Document',
    discipline: document.discipline,
    revision: document.current_revision?.revision_code ? `Rev ${document.current_revision.revision_code}` : '—',
    status: status.status,
    statusLabel: status.label,
    suitability: suitabilityLabel(document.suitability_status),
    owner: 'EvoRail',
    due: '—',
    updated: formatDate(document.updated_at),
  };
}

const statusMeta: Record<StatusKind, {variant: 'success' | 'warning' | 'error' | 'accent' | 'neutral'; badge: 'success' | 'warning' | 'error' | 'info' | 'neutral'}> = {
  current: {variant: 'success', badge: 'success'},
  review: {variant: 'neutral', badge: 'info'},
  returned: {variant: 'error', badge: 'error'},
  draft: {variant: 'neutral', badge: 'neutral'},
  ifc: {variant: 'neutral', badge: 'info'},
  overdue: {variant: 'error', badge: 'error'},
};

const theme = defineTheme({
  name: 'infrasoft-evorail-enterprise',
  color: {accent: ['#e74c3c', '#f27364'], neutralStyle: 'warm', contrast: 'standard'},
  typography: {
    scale: {base: 14, ratio: 1.2},
    body: {family: 'Inter', fallbacks: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'},
    heading: {family: 'Inter', fallbacks: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', weight: 'semibold'},
    code: {family: '"SFMono-Regular", Consolas, monospace', fallbacks: 'monospace'},
  },
  radius: {base: 4, multiplier: 1},
  localTokens: {
    '--infrasoft-background': ['#f5f6f4', '#17191a'],
    '--infrasoft-surface': ['#ffffff', '#232526'],
    '--infrasoft-muted': ['#ecefee', '#2b2d2e'],
    '--infrasoft-accent': ['#e74c3c', '#f27364'],
    '--infrasoft-accent-soft': ['#fff0ed', '#452522'],
    '--sidebar-width': ['134px', '134px'],
    '--sidebar-width-icon': ['35px', '35px'],
    '--sidebar-background': ['#fcfcfb', '#1f2221'],
    '--sidebar-border': ['#e7e4df', '#3e403e'],
    '--sidebar-foreground': ['#292826', '#f1efec'],
    '--sidebar-muted': ['#74716c', '#b6b2ad'],
    '--sidebar-hover': ['#f3f1ee', '#2a2d2b'],
    '--sidebar-active': ['#fff2ef', '#452522'],
    '--sidebar-active-foreground': ['#96352d', '#f5c0b7'],
  },
  tokens: {
    '--color-accent': ['#e74c3c', '#f27364'],
    '--color-on-accent': ['#ffffff', '#ffffff'],
    '--color-background-surface': ['#ffffff', '#232526'],
    '--color-background-muted': ['#ecefee', '#2b2d2e'],
    '--color-text-primary': ['#2f3437', '#f1efec'],
    '--color-text-secondary': ['#6b7276', '#b9b4ae'],
    '--color-border': ['#dfe3e1', '#494642'],
    '--radius-container': '10px',
  },
});

const commands = [
  {id: 'search', label: 'Rechercher des documents', auxiliaryData: {group: 'Navigation', aliases: ['rechercher des dessins', 'recherche globale']}},
  {id: 'documents', label: 'Ouvrir les documents', auxiliaryData: {group: 'Navigation', aliases: ['registre', 'registre documentaire']}},
  {id: 'drawings', label: 'Ouvrir les dessins', auxiliaryData: {group: 'Navigation', aliases: ['plans', 'maquettes']}},
  {id: 'reviews', label: 'Ouvrir les avis', auxiliaryData: {group: 'Navigation', aliases: ['en revue']}},
  {id: 'approvals', label: 'Ouvrir les approbations', auxiliaryData: {group: 'Navigation', aliases: ['signatures', 'décisions finales']}},
  {id: 'transmittal', label: 'Créer une transmission', auxiliaryData: {group: 'Actions', aliases: ['package d émission']}},
  {id: 'work', label: 'Voir mon travail', auxiliaryData: {group: 'Navigation', aliases: ['assigné à moi']}},
  {id: 'settings', label: 'Ouvrir les paramètres du projet', auxiliaryData: {group: 'Administration', aliases: ['configuration']}},
];

const commandSource = createStaticSource(commands, {
  keywords: item => item.auxiliaryData?.aliases ?? [],
});

function navigate(path: string) {
  navigateInProject(path);
}

function displayInitials(name: string) {
  return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

function statusBadge(row: DocumentRow) {
  const meta = statusMeta[row.status];
  return (
    <span className="status-cell">
      <StatusDot variant={meta.variant} label={row.statusLabel} />
      <Badge variant={meta.badge} label={row.statusLabel} />
    </span>
  );
}

function documentColumns(showType = false, download?: (row: DocumentRow) => void): EvoColumnDef<DocumentRow>[] {
  const columns: EvoColumnDef<DocumentRow>[] = [];
  columns.push(
    {
      accessorKey: 'id',
      header: 'Document',
      size: 300,
      cell: ({row}) => (
          <button className="document-link" onClick={() => navigate(`/documents/${row.original.backendId}`)}>
          <span className="document-code">{row.original.id}</span>
          <span className="document-name">{row.original.title}</span>
        </button>
      ),
    },
    ...(showType ? [{accessorKey: 'type', header: 'Type', size: 110, cell: ({row}: {row: {original: DocumentRow}}) => <span className="muted-cell">{row.original.type}</span>}] : []),
    {accessorKey: 'revision', header: 'Révision', size: 88, cell: ({row}) => <span className="revision-cell">{row.original.revision}</span>},
    {accessorKey: 'status', header: 'Statut', size: 180, cell: ({row}) => statusBadge(row.original)},
    {accessorKey: 'discipline', header: 'Discipline', size: 140, cell: ({row}) => <span>{row.original.discipline}</span>},
    {accessorKey: 'owner', header: 'Responsable', size: 150, cell: ({row}) => <span className="owner-cell"><Avatar name={row.original.owner} size="xsm" /><span>{row.original.owner}</span></span>},
    {accessorKey: 'due', header: 'Échéance', size: 120, cell: ({row}) => <span className={row.original.overdue ? 'overdue-text' : 'date-cell'}>{row.original.due}</span>},
    {accessorKey: 'updated', header: 'Mis à jour', size: 124, cell: ({row}) => <span className="date-cell">{row.original.updated}</span>},
    {id: 'actions', header: 'Actions', size: 70, enableSorting: false, cell: ({row}) => <MoreMenu label={`Actions pour ${row.original.id}`} size="sm" items={[{label: 'Ouvrir le document', onClick: () => navigate(`/documents/${row.original.backendId}`)}, {label: 'Télécharger', onClick: () => download ? download(row.original) : navigate(`/documents/${row.original.backendId}`)}, {label: 'Partager', onClick: () => {}}]} />},
  );
  return columns;
}

function Shell({children, darkMode, setDarkMode}: {children: ReactNode; darkMode: boolean; setDarkMode: (value: boolean) => void}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const path = projectPathname();
  const {user, project} = useEvoRail();
  const permittedCommands = useMemo(() => createStaticSource(commands.filter(item => canNavigate(project, ({documents: '/documents', drawings: '/drawings', reviews: '/reviews', approvals: '/approvals', transmittal: '/transmittals', work: '/my-work', settings: '/settings'} as Record<string, string>)[item.id] ?? '/overview')), {keywords: item => item.auxiliaryData?.aliases ?? []}), [project]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <Theme theme={theme} mode={darkMode ? 'dark' : 'light'}>
      <div className={`v2-root ${darkMode ? 'v2-dark' : ''}`}>
        <AppShell
          contentPadding={0}
          height="fill"
          variant="wash"
          topNav={
            <TopNav
              label="Navigation globale Infrasoft"
              heading={
                <div className="top-context">
                  <span>Projet actif</span>
                  <strong>{project ? `${project.name} · ${project.code}` : "Aucun projet sélectionné"}</strong>
                </div>
              }
              centerContent={
                <button className="global-search" onClick={() => setPaletteOpen(true)} aria-label="Recherche de documents, dessins, bordereaux">
                  <Icon icon={MagnifyingGlassIcon} size="sm" />
                  <span>Recherche de documents, dessins, bordereaux…</span>
                  <kbd>Ctrl K</kbd>
                </button>
              }
              endContent={
                <div className="top-actions">
                  <IconButton label="Notifications" icon={<Icon icon={BellIcon} size="sm" />} variant="ghost" tooltip="Notifications" />
                  <IconButton label="Aide" icon={<Icon icon={QuestionMarkCircleIcon} size="sm" />} variant="ghost" tooltip="Aide" />
                  <IconButton label={darkMode ? 'Utiliser le thème clair' : 'Utiliser le thème sombre'} icon={<Icon icon={darkMode ? SunIcon : MoonIcon} size="sm" />} variant="ghost" tooltip="Thème" onClick={() => setDarkMode(!darkMode)} />
                  <button className="profile-button" aria-label="Ouvrir le menu du compte"><Avatar name={user?.name ?? "Compte"} size="sm" /><span>{user?.name}</span><ChevronRightIcon /></button>
                </div>
              }
            />
          }
          sideNav={<AppSidebar pathname={path} onNavigate={navigate} />}
        >
          <main className="v2-main">{children}</main>
        </AppShell>
        <CommandPalette
          isOpen={paletteOpen}
          onOpenChange={setPaletteOpen}
          label="Palette de commandes Infrasoft EvoRail"
          searchSource={permittedCommands}
          onValueChange={value => {
            setPaletteOpen(false);
            const target: Record<string, string> = {documents: '/documents', drawings: '/drawings', reviews: '/reviews', approvals: '/approvals', work: '/my-work', settings: '/settings', search: '/documents', transmittal: '/transmittals'};
            navigate(target[value] ?? '/overview');
          }}
          renderItem={(item, isSelected) => <div className={`command-item ${isSelected ? 'is-selected' : ''}`}><span>{item.label}</span><span className="command-hint">{(item.auxiliaryData as {group?: string} | undefined)?.group}</span></div>}
          footer={<div className="command-footer"><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>Enter</kbd> Open</span><span><kbd>Esc</kbd> Close</span></div>}
        />
        <EvoToaster />
      </div>
    </Theme>
  );
}

function PageHeader({eyebrow, title, subtitle, actions}: {eyebrow?: string; title: string; subtitle?: ReactNode; actions?: ReactNode}) {
  return <EvoPageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} actions={actions} />;
}

function Overview() {
  const {documents: apiDocuments, project, loading, error} = useEvoRail();
  const rows = apiDocuments.map(apiDocumentToRow);
  const [workflow, setWorkflow] = useState('all');
  const filtered = workflow === 'all' ? rows : rows.filter(row => row.status === workflow || (workflow === 'ifc' && row.suitability === 'IFC'));
  const summary = [[String(rows.length), 'Documents contrôlés'], [String(rows.filter(row => row.status === 'current').length), 'Actuels'], [String(rows.filter(row => row.status === 'review').length), 'En revue'], [String(rows.filter(row => row.status === 'returned').length), 'Retournés'], [String(rows.filter(row => row.overdue).length), 'En retard'], [String(rows.filter(row => row.suitability === 'IFC').length), 'IFC']];

  return <div className="page-frame overview-page">
    <PageHeader eyebrow="PROGRAMME NATIONAL DES CHEMINS DE FER" title={project?.name ?? 'Projet'} subtitle={<><strong>{project?.phase ?? ''}</strong><span className="header-divider">·</span>Projet contrôlé via EvoRail API</>} actions={<><Button label="Recherche" variant="secondary" size="sm" icon={<Icon icon={MagnifyingGlassIcon} size="sm" />} /><Button label="Filtrer" variant="secondary" size="sm" icon={<Icon icon={FunnelIcon} size="sm" />} /><Button label="Exporter" variant="secondary" size="sm" icon={<Icon icon={ArrowDownTrayIcon} size="sm" />} /><MoreMenu label="Plus d'actions projet" size="sm" items={[{label: 'Paramètres du projet', onClick: () => {}}, {label: 'Copier le lien du projet', onClick: () => {}}]} /></>} />
    {loading && <EvoAsyncState state="loading" message="Connexion à EvoRail…" />}
    {error && <EvoAsyncState state="error" message={error} />}
    <section className="summary-strip" aria-label="Project summary">{summary.map(([value, label]) => <div className="summary-item" key={label}><strong>{value}</strong><span>{label}</span></div>)}</section>
    <section className="workflow-section"><div className="section-heading"><div><div className="eyebrow">À TRAITER</div><h2>Documents à traiter</h2></div><span className="section-note">Mis à jour le 26 sept. 2026 · 09:42</span></div><div className="workflow-bar"><SegmentedControl value={workflow} onChange={setWorkflow} label="État du flux documentaire" size="sm" layout="hug"><SegmentedControlItem value="all" label="Tous 40" /><SegmentedControlItem value="review" label="En revue 13" /><SegmentedControlItem value="returned" label="Retournés 3" /><SegmentedControlItem value="draft" label="Brouillons 3" /><SegmentedControlItem value="current" label="Actuels 21" /><SegmentedControlItem value="ifc" label="IFC 6" /></SegmentedControl><Button label="Ouvrir le registre" variant="ghost" size="sm" href={projectHref("/documents")} icon={<Icon icon={ArrowTopRightOnSquareIcon} size="sm" />} /></div></section>
    <section className="queue-layout"><Card variant="default" padding={0} className="work-queue-card"><div className="table-toolbar"><div><h3>Documents prioritaires</h3><span>{filtered.length} enregistrements visibles</span></div><Button label="Voir tous les documents" variant="ghost" size="sm" href={projectHref("/documents")} /></div><EvoDataTable data={filtered} columns={documentColumns(true)} idKey="id" empty={<div className="evo-table-state">Aucun document prioritaire.</div>} /><div className="table-footer"><span>Affichage de {filtered.length} documents sur {rows.length}</span><button onClick={() => navigate('/documents')}>Voir le registre complet <ChevronRightIcon /></button></div></Card><AttentionPanel rows={rows} /></section>
  </div>;
}

function AttentionPanel({rows}: {rows: DocumentRow[]}) {
  const row = rows.find(item => item.overdue) ?? rows[0];
  if (!row) return null;
  return <aside className="attention-panel"><div className="attention-heading"><div><div className="eyebrow">ATTENTION</div><h3>{row.overdue ? 'Document en retard' : 'Dernier document'}</h3></div><StatusDot variant={row.overdue ? 'error' : 'neutral'} label={row.overdue ? 'En retard' : 'À surveiller'} isPulsing={row.overdue} /></div><div className="attention-document"><div className="attention-icon"><ExclamationTriangleIcon /></div><div><button className="document-link" onClick={() => navigate(`/documents/${row.backendId}`)}><span className="document-code">{row.id}</span><span className="document-name">{row.title}</span></button><p>{row.overdue ? 'Révision technique dépassée.' : 'Document contrôlé disponible.'}</p></div></div><dl className="attention-meta"><div><dt>Échéance</dt><dd>{row.due}</dd></div><div><dt>Responsable</dt><dd><Avatar name={row.owner} size="xsm" /> {row.owner}</dd></div></dl><Button label="Ouvrir le document" variant="secondary" size="sm" width="100%" onClick={() => navigate(`/documents/${row.backendId}`)} /></aside>;
}

export function DocumentsPage() {
  const {project} = useEvoRail();
  const [params, updateUrl] = useUrlSearch();
  const state = readRegisterState(params.toString());
  const query = state.search ?? '';
  const status = state.workflow_status === 'under_review' ? 'review' : state.workflow_status === 'returned' ? 'returned' : state.effective_state === 'current' ? 'current' : 'all';
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({total: 0, current_page: 1, last_page: 1, per_page: 25});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  const [generation, setGeneration] = useState(0);
  useEffect(() => {const invalidate = () => setGeneration(value => value + 1); window.addEventListener('evorail:documents-invalidated', invalidate); return () => window.removeEventListener('evorail:documents-invalidated', invalidate);}, []);
  const selected = params.getAll('selected').flatMap(value => value.split(',')).filter(Boolean);
  const setSelected = (value: string[] | ((items: string[]) => string[])) => updateUrl({selected: (typeof value === 'function' ? value(selected) : value).join(',')});
  const setQuery = (search: string) => updateUrl({search, page: '1'});
  const setStatus = (value: string) => updateUrl({workflow_status: value === 'review' ? 'under_review' : value === 'returned' ? 'returned' : undefined, effective_state: value === 'current' ? 'current' : undefined, page: '1'});
  const queryKey = JSON.stringify(state);
  useEffect(() => {
    let cancelled = false;
    setRows([]); setError('');
    if (!project) return;
    setLoading(true);
    void evoRailApi.documents(project.id, JSON.parse(queryKey)).then(result => {
      if (!cancelled) {setRows(result.items.map(apiDocumentToRow)); setPagination(result.pagination);}
    }).catch(cause => {if (!cancelled) setError(apiErrorMessage(cause));})
      .finally(() => {if (!cancelled) setLoading(false);});
    return () => {cancelled = true;};
  }, [project?.id, queryKey, generation]);
  const filtered = rows;
  const downloadRow = (row: DocumentRow) => {
    if (!row.currentRevisionId) {setError('Fichier manquant : aucune révision actuelle.'); return;}
    void evoRailApi.revision(row.currentRevisionId).then(downloadRevision).catch(cause => setError(apiErrorMessage(cause)));
  };
  const rowSelection = Object.fromEntries(selected.map(id => [id, true])) as EvoRowSelectionState;
  const addFilter = (rule: FilterRule) => { setFilterRules(current => [...current.filter(item => item.field !== rule.field), rule]); updateUrl({[rule.field]: String(rule.value ?? ''), page: '1'}); };
  const removeFilter = (rule: FilterRule) => { setFilterRules(current => current.filter(item => item.id !== rule.id)); updateUrl({[rule.field]: undefined, page: '1'}); };

  return <div className="page-frame register-page"><PageHeader eyebrow="REGISTRE DU PROJET" title="Documents" subtitle="Documents contrôlés servis par l'API EvoRail" actions={<><Button label="Filtrer" onClick={() => setShowFilters(!showFilters)} variant="secondary" size="sm" icon={<Icon icon={FunnelIcon} size="sm" />} /><Button label="Colonnes" variant="secondary" size="sm" icon={<Icon icon={ViewColumnsIcon} size="sm" />} /><Button label="Exporter" variant="secondary" size="sm" icon={<Icon icon={ArrowDownTrayIcon} size="sm" />} /><Button label="Importer / Créer" variant="primary" size="sm" icon={<Icon icon={PlusIcon} size="sm" />} /></>} /><div className="register-toolbar"><div className="register-search"><TextInput label="Rechercher des documents" isLabelHidden value={query} onChange={setQuery} placeholder="Rechercher des documents, codes, titres…" startIcon={<Icon icon={MagnifyingGlassIcon} size="sm" />} size="md" /></div><div className="filter-chips"><button className={status === 'all' ? 'filter-chip is-active' : 'filter-chip'} onClick={() => setStatus('all')}>Tous <span>{pagination.total}</span></button><button className={status === 'review' ? 'filter-chip is-active' : 'filter-chip'} onClick={() => setStatus('review')}>En revue</button><button className={status === 'returned' ? 'filter-chip is-active' : 'filter-chip'} onClick={() => setStatus('returned')}>Retournés</button><button className={status === 'current' ? 'filter-chip is-active' : 'filter-chip'} onClick={() => setStatus('current')}>Actuels</button><button className="filter-chip" onClick={() => setShowFilters(!showFilters)}>Plus de filtres <ChevronRightIcon /></button></div></div>{showFilters && <div className="register-toolbar"><EvoFilterBuilder schema={documentFilterSchema} onAdd={addFilter} />{filterRules.map(rule => <EvoFilterChip key={rule.id} rule={rule} field={documentFilterSchema.fields.find(field => field.id === rule.field)} onRemove={() => removeFilter(rule)} />)}{(['workflow_status', 'suitability', 'effective_state', 'discipline', 'revision'] as const).map(key => <label key={key}>{key}<input aria-label={key} value={state[key] ?? ''} onChange={event => updateUrl({[key]: event.target.value, page: '1'})} /></label>)}<label><input type="checkbox" checked={state.current_only ?? false} onChange={event => updateUrl({current_only: event.target.checked ? '1' : '0', page: '1'})} />Actuels seulement</label></div>}<div className="register-toolbar"><label>Trier <select aria-label="Trier" value={state.sort ?? 'document_number'} onChange={event => updateUrl({sort: event.target.value, page: '1'})}>{['document_number', '-document_number', 'title', '-title', 'updated_at', '-updated_at'].map(value => <option key={value}>{value}</option>)}</select></label><label>Par page <select aria-label="Par page" value={state.per_page} onChange={event => updateUrl({per_page: event.target.value, page: '1'})}>{[10, 25, 50, 100].map(value => <option key={value}>{value}</option>)}</select></label></div><EvoBulkActionBar count={selected.length}><Button label="Télécharger" onClick={() => rows.filter(row => selected.includes(row.id)).forEach(downloadRow)} variant="secondary" size="sm" icon={<Icon icon={ArrowDownTrayIcon} size="sm" />} /><Button label="Affecter" variant="secondary" size="sm" icon={<Icon icon={UsersIcon} size="sm" />} /><Button label="Plus" variant="ghost" size="sm" /><IconButton label="Effacer la sélection" icon={<Icon icon={XMarkIcon} size="sm" />} variant="ghost" onClick={() => setSelected([])} /></EvoBulkActionBar><Card variant="default" padding={0} className="register-card"><EvoDataTable data={filtered} columns={documentColumns(true, downloadRow)} idKey="id" enableRowSelection rowSelection={rowSelection} onRowSelectionChange={next => setSelected(Object.keys(next))} selectionLabel={row => `Sélectionner ${row.id}`} loading={loading} error={error || undefined} empty={<div className="evo-table-state">Aucun document correspondant.</div>} /><div className="table-footer"><span>Affichage de {filtered.length} documents sur {pagination.total}</span><nav className="pagination" aria-label="Pages du registre documentaire"><button aria-label="Page précédente" disabled={loading || state.page === 1} onClick={() => updateUrl({page: String((state.page ?? 1) - 1)})}><ArrowLeftIcon /></button><button className="is-current">{state.page}</button><button aria-label="Page suivante" disabled={loading || (state.page ?? 1) >= pagination.last_page} onClick={() => updateUrl({page: String((state.page ?? 1) + 1)})}>→</button></nav></div></Card></div>;
}

export function DocumentDetail({id, exactRevisionId}: {id: string; exactRevisionId?: string}) {
  const {project} = useEvoRail();
  const [params, updateUrl] = useUrlSearch();
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [exactRevision, setExactRevision] = useState<ApiRevision | null>(null);
  const [comparison, setComparison] = useState<RevisionComparison | null>(null);
  const [comparisonError, setComparisonError] = useState('');
  const [success, setSuccess] = useState('');
  const [generation, setGeneration] = useState(0);
  const [detail, setDetail] = useState<ApiDocument | null>(null);
  const [revisions, setRevisions] = useState<ApiRevision[]>([]);
  const [activity, setActivity] = useState<Array<{id: string; event_type: string; created_at?: string}>>([]);
  const tab = params.get('tab') ?? 'overview';
  const setTab = (tab: string) => updateUrl({tab});
  const [revisionCode, setRevisionCode] = useState('B');
  const [revisionTitle, setRevisionTitle] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionError, setRevisionError] = useState('');
  const [creatingRevision, setCreatingRevision] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDetail(null); setExactRevision(null); setRevisions([]); setActivity([]); setRevisionError(''); setLoadError(''); setLoading(true);
    const load = async () => {
      const exact = exactRevisionId ? await evoRailApi.revision(exactRevisionId) : null;
      const documentId = exact?.document_id ?? id;
      if (id && exact && exact.document_id !== id) throw Object.assign(new Error('Révision étrangère au document.'), {status: 404});
      const loaded = await evoRailApi.document(documentId);
      if (cancelled) return;
      setDetail(loaded); setExactRevision(exact); setRevisionTitle(loaded.title);
      const results = await Promise.allSettled([evoRailApi.revisions(documentId), evoRailApi.activity(documentId)]);
      if (cancelled) return;
      if (results[0].status === 'fulfilled') setRevisions(results[0].value); else setRevisionError(apiErrorMessage(results[0].reason));
      if (results[1].status === 'fulfilled') setActivity(results[1].value); else setLoadError(apiErrorMessage(results[1].reason));
    };
    void load().catch(cause => {if (!cancelled) setLoadError(apiErrorMessage(cause));}).finally(() => {if (!cancelled) setLoading(false);});
    return () => {cancelled = true;};
  }, [id, exactRevisionId, generation]);
  const currentRevision = exactRevisionId ? exactRevision : revisions.find(revision => revision.id === detail?.current_revision_id) ?? null;
  const compareId = params.get('compare') ?? '';
  useEffect(() => {
    let cancelled = false;
    setComparison(null); setComparisonError('');
    if (!currentRevision || !compareId) return;
    void evoRailApi.compare(currentRevision.id, compareId).then(result => {if (!cancelled) setComparison(result);}).catch(cause => {if (!cancelled) setComparisonError(apiErrorMessage(cause));});
    return () => {cancelled = true;};
  }, [currentRevision?.id, compareId]);
  if (loading) return <div className="page-frame api-state" role="status">Chargement du document…</div>;
  if (!detail) return <div className="page-frame"><Card variant="default" padding={6}><h2 role="alert">{loadError || 'Document introuvable'}</h2><Button label="Retour au registre" variant="secondary" size="sm" onClick={() => navigate('/documents')} /></Card></div>;
  const row = apiDocumentToRow(exactRevision ? {...detail, title: exactRevision.title, workflow_status: exactRevision.workflow_status, suitability_status: exactRevision.suitability_status, effective_state: exactRevision.effective_state, current_revision: exactRevision} : detail);
  const download = (revision: ApiRevision | null) => {if (revision) void downloadRevision(revision).catch(cause => setRevisionError(apiErrorMessage(cause)));};
  const activityLabel = (event: string) => event.replaceAll('.', ' · ').replaceAll('_', ' ');
  const createRevision = async (event: React.FormEvent) => {
    event.preventDefault();
    if (creatingRevision) return;
    if (!revisionFile) { setRevisionError('Sélectionnez un fichier contrôlé.'); return; }
    setCreatingRevision(true);
    setRevisionError('');
    try {
      await evoRailApi.createRevision(detail.id, {revisionCode, title: revisionTitle || row.title, changeReason, file: revisionFile});
      setSuccess('Révision créée.');
      setGeneration(value => value + 1);
      window.dispatchEvent(new Event('evorail:documents-invalidated'));
      setRevisionFile(null);
      setChangeReason('');
    } catch (cause) {
      setRevisionError(apiErrorMessage(cause));
    } finally {
      setCreatingRevision(false);
    }
  };

  return <div className="page-frame detail-page">{loadError && <div className="api-state api-error" role="alert">{loadError}</div>}{revisionError && <div className="api-state api-error" role="alert">{revisionError}</div>}{success && <div className="api-state" role="status">{success}</div>}<div className="breadcrumbs"><button onClick={() => navigate('/documents')}>Documents</button><ChevronRightIcon /><span>{row.id}</span></div><PageHeader eyebrow={`${row.type.toUpperCase()} · ${row.discipline.toUpperCase()}`} title={row.id} subtitle={<><span>{row.title}</span><span className="header-divider">·</span><strong>{row.revision}</strong><span className="header-divider">·</span>{statusBadge(row)}</>} actions={<><Button label="Télécharger" variant="secondary" size="sm" icon={<Icon icon={ArrowDownTrayIcon} size="sm" />} onClick={() => download(currentRevision)} /><Button label="Partager" variant="secondary" size="sm" icon={<Icon icon={ShareIcon} size="sm" />} /><Button label="Soumettre à l'avis" variant="primary" size="sm" icon={<Icon icon={PaperAirplaneIcon} size="sm" />} /></>} /><div className="detail-tabs"><TabList value={tab} onChange={setTab} aria-label="Sections du document" role="tablist" size="sm" hasDivider><Tab value="overview" label="Aperçu" /><Tab value="versions" label={`Versions${revisions.length ? ` (${revisions.length})` : ''}`} /><Tab value="reviews" label="Avis" /><Tab value="comments" label="Commentaires" /><Tab value="transmittals" label="Transmissions" /><Tab value="history" label="Historique" /></TabList></div>{tab === 'versions' ? <div className="detail-grid"><div className="detail-main"><section className="content-section"><div className="section-heading"><div><div className="eyebrow">HISTORIQUE DES RÉVISIONS</div><h2>Révisions immuables</h2></div></div><label>Comparer les métadonnées avec <select aria-label="Comparer les révisions" value={compareId} onChange={event => updateUrl({compare: event.target.value})}><option value="">Sélectionner une révision</option>{revisions.filter(revision => revision.id !== currentRevision?.id).map(revision => <option key={revision.id} value={revision.id}>{revision.revision_code}</option>)}</select></label>{comparisonError && <p role="alert">{comparisonError}</p>}{comparison && <table><thead><tr><th>Métadonnée</th><th>{comparison.from}</th><th>{comparison.to}</th></tr></thead><tbody>{Object.entries(comparison.changes).map(([field, change]) => <tr key={field}><td>{field}</td><td>{typeof change.from === 'object' ? JSON.stringify(change.from) : String(change.from ?? '—')}</td><td>{typeof change.to === 'object' ? JSON.stringify(change.to) : String(change.to ?? '—')}</td></tr>)}</tbody></table>}<div className="revision-list">{revisions.length === 0 && <p className="muted-cell">Aucune révision chargée.</p>}{revisions.map(revision => <div className="revision-item" key={revision.id}><div><button className="document-link" onClick={() => navigate(`/documents/${detail.id}/revisions/${revision.id}`)}><strong>Rev {revision.revision_code} · {revision.title}</strong></button><span>{revision.workflow_status} · {revision.suitability_status}</span></div><div><span>{revision.file?.original_filename ?? 'Fichier protégé'}</span><button className="text-button" onClick={() => download(revision)}>Télécharger</button></div></div>)}</div></section></div><aside className="detail-rail"><Card variant="default" padding={4} className="metadata-card"><h3>Créer une révision</h3>{project?.permissions?.createRevision !== true ? <p>Accès refusé : création de révision.</p> : <form className="revision-form" onSubmit={createRevision}><label>Code de révision<input value={revisionCode} onChange={event => setRevisionCode(event.target.value)} required /></label><label>Titre<input value={revisionTitle} onChange={event => setRevisionTitle(event.target.value)} required /></label><label>Motif du changement<textarea value={changeReason} onChange={event => setChangeReason(event.target.value)} required /></label><label>Fichier contrôlé<input type="file" onChange={event => setRevisionFile(event.target.files?.[0] ?? null)} required /></label>{revisionError && <div className="auth-error" role="alert">{revisionError}</div>}<Button label="Créer la révision" type="submit" variant="primary" size="sm" width="100%" isLoading={creatingRevision} /></form>}</Card></aside></div> : tab === 'history' ? <div className="activity-list">{activity.length === 0 && <p>Aucune activité.</p>}{activity.map(event => <ActivityItem key={event.id} icon={PencilSquareIcon} title={activityLabel(event.event_type)} by="EvoRail" date={formatDate(event.created_at)} />)}</div> : tab !== 'overview' ? <EmptyTab tab={tab} /> : <div className="detail-grid"><div className="detail-main"><section className="content-section"><div className="section-heading"><div><div className="eyebrow">APERÇU DU DOCUMENT</div><h2>{row.title}</h2></div><Badge label={row.revision} variant="info" /></div><ProtectedPreview revision={currentRevision} /></section><section className="content-section"><div className="section-heading"><div><div className="eyebrow">ACTIVITÉ</div><h2>Activité récente</h2></div><button className="text-button" onClick={() => setTab('history')}>Voir l'historique <ChevronRightIcon /></button></div><div className="activity-list">{activity.length === 0 && <p className="muted-cell">Aucune activité chargée.</p>}{activity.slice(0, 5).map(event => <ActivityItem key={event.id} icon={event.event_type.includes('revision') ? PencilSquareIcon : CheckCircleIcon} title={activityLabel(event.event_type)} by="EvoRail" date={formatDate(event.created_at)} />)}</div></section></div><aside className="detail-rail"><Card variant="default" padding={4} className="metadata-card"><div className="rail-heading"><h3>État du contrôle</h3><StatusDot variant={statusMeta[row.status].variant} label={row.statusLabel} /></div><div className="rail-status"><Badge label={row.statusLabel} variant={statusMeta[row.status].badge} /><Badge label={row.suitability} variant="neutral" /></div><dl className="metadata-list"><div><dt>Responsable</dt><dd><Avatar name={row.owner} size="sm" /><span>{row.owner}<small>Responsable de discipline</small></span></dd></div><div><dt>Révision</dt><dd>{row.revision}</dd></div><div><dt>Échéance</dt><dd className={row.overdue ? 'overdue-text' : ''}>{row.due}</dd></div><div><dt>Dernière mise à jour</dt><dd>{row.updated}</dd></div><div><dt>Type de document</dt><dd>{row.type}</dd></div><div><dt>Droits d'accès</dt><dd><ShieldCheckIcon /> Accès contrôlé au projet</dd></div></dl></Card></aside></div>}</div>;
}

function ActivityItem({icon, title, by, date}: {icon: typeof CheckCircleIcon; title: string; by: string; date: string}) {
  return <div className="activity-item"><span className="activity-icon"><Icon icon={icon} size="sm" /></span><div><strong>{title}</strong><span>{by} · {date}</span></div></div>;
}

function EmptyTab({tab}: {tab: string}) {
  return <Card variant="default" padding={6} className="empty-tab"><CircleStackIcon /><h2>{tab[0].toUpperCase() + tab.slice(1)} est prêt pour les enregistrements contrôlés</h2><p>Cette version de démonstration reste connectée au même registre documentaire et à l'historique des révisions.</p><Button label="Retour à l'aperçu" variant="secondary" size="sm" onClick={() => navigate('/overview')} /></Card>;
}

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const {signIn, status} = useEvoRail();
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) { setError('Enter your work email and password to continue.'); return; }
    setError('');
    setLoading(true);
    try { await signIn(email, password); if (projectPathname() === '/signin') navigate('/overview'); }
    catch (cause) { setError((cause as Error).message || 'Connexion impossible.'); }
    finally { setLoading(false); }
  };
  return <Theme theme={theme} mode="light"><div className="auth-page"><section className="auth-identity"><div className="auth-brand"><span className="infrasoft-wordmark">INFRASOFT</span><span className="auth-product"><strong>EvoRail</strong><small>Contrôle documentaire ferroviaire</small></span></div><div className="auth-identity-copy"><div className="eyebrow">PROGRAMME NATIONAL DES CHEMINS DE FER</div><h1>Une source contrôlée pour chaque document de projet.</h1><p>Gérez les révisions, les avis, les transmissions et les statuts d'émission de la Ligne A avec une piste d'audit claire.</p><div className="auth-trust"><ShieldCheckIcon /><span>Espace d'ingénierie · Accès contrôlé</span></div></div><span className="auth-version">Infrasoft EvoRail · v2.0</span></section><main className="auth-panel"><div className="auth-panel-inner"><div className="mobile-auth-brand"><span className="infrasoft-wordmark">INFRASOFT</span><strong>EvoRail</strong></div><div className="auth-heading"><div className="eyebrow">BIENVENUE</div><h2>Se connecter à votre espace</h2><p>Utilisez votre compte d'organisation pour accéder à la Ligne A.</p></div>{status === 'session-expired' && <div className="auth-error" role="alert">Votre session a expiré. Reconnectez-vous pour continuer.</div>}<form onSubmit={submit} className="auth-form"><TextInput label="Adresse e-mail professionnelle" type="email" value={email} onChange={setEmail} placeholder="nom@organisation.com" autoComplete="email" isRequired status={error && !email ? {type: 'error', message: "L'adresse e-mail est obligatoire"} : undefined} /><div className="password-field"><div className="password-label"><label htmlFor="auth-password">Mot de passe</label><button type="button" onClick={() => {}}>Mot de passe oublié&nbsp;?</button></div><TextInput label="Mot de passe" isLabelHidden type={showPassword ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="Saisissez votre mot de passe" autoComplete="current-password" isRequired /><IconButton label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} icon={<Icon icon={showPassword ? EyeSlashIcon : EyeIcon} size="sm" />} variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)} /></div>{error && <div className="auth-error" role="alert"><ExclamationTriangleIcon /><span>{error === 'Enter your work email and password to continue.' ? 'Saisissez votre adresse e-mail professionnelle et votre mot de passe pour continuer.' : error}</span></div>}<Button label="Se connecter" type="submit" variant="primary" size="lg" width="100%" isLoading={loading} /><div className="auth-divider"><span>ou continuer avec</span></div><Button label="Continuer avec SSO" variant="secondary" size="lg" width="100%" icon={<Icon icon={BuildingOffice2Icon} size="sm" />} onClick={() => {}} /><div className="sso-row"><Button label="Google" variant="ghost" size="sm" width="100%" onClick={() => {}} /><Button label="Microsoft" variant="ghost" size="sm" width="100%" onClick={() => {}} /></div></form><p className="auth-admin-note">L'accès est géré par votre organisation.<br /><button onClick={() => {}}>Contacter votre administrateur</button> si vous avez besoin d'un compte.</p></div></main></div></Theme>;
}

function PlaceholderPage({title}: {title: string}) {
  const copy: Record<string, string> = {
    organizations: 'Les organisations, contacts et périmètres de membre attendent leur contrat API dédié.',
    reports: 'Les rapports opérationnels attendent leurs agrégats et leur contrat d’export contrôlé.',
    issues: 'Les tickets et écarts attendent leur workflow d’enregistrement et de traçabilité.',
    settings: 'Les paramètres de projet attendent leur matrice de droits et leur contrat de persistance.',
  };
  return <div className="page-frame"><PageHeader eyebrow="SURFACE CONTRÔLÉE" title={title} subtitle="Cette surface conserve le shell EvoRail jusqu’à la définition de son contrat de données." actions={<Button label="Retour à l’aperçu" variant="secondary" size="sm" onClick={() => navigate('/overview')} />} /><EvoDetailPanel title="Surface en attente de contrat" eyebrow="MODULE NON CONNECTÉ"><EvoAsyncState state="empty" message={copy[title.replaceAll(' ', '-')] ?? 'Aucune donnée contrôlée n’est disponible pour cette surface.'} /><p className="muted-cell">Aucune donnée d’exemple n’est injectée lorsque l’API ne définit pas encore ce module.</p></EvoDetailPanel></div>;
}

function AuthOrApplication() {
  const [path, setPath] = useState(projectPathname());
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => { const onPopState = () => setPath(projectPathname()); window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState); }, []);
  const {status, refresh, project, projectStatus, projectError, error} = useEvoRail();
  if (status === 'loading') return <Theme theme={theme} mode="light"><div className="page-frame"><EvoAsyncState state="loading" message="Connexion à EvoRail…" /></div></Theme>;
  if (status === 'backend-unavailable' || status === 'forbidden' || status === 'error') return <Theme theme={theme} mode="light"><div className="page-frame"><EvoAsyncState state={status === 'backend-unavailable' ? 'offline' : status === 'forbidden' ? 'forbidden' : 'error'} title={status === 'backend-unavailable' ? 'Connexion au serveur indisponible' : undefined} message={error ?? undefined} onRetry={() => void refresh()} /></div></Theme>;
  if (status === 'unauthenticated' || status === 'session-expired') return <SignIn />;
  if (projectStatus !== 'ready') return <Shell darkMode={darkMode} setDarkMode={setDarkMode}><div className="page-frame"><Card variant="default" padding={6}><h2>{projectStatus === 'loading' ? 'Chargement du projet…' : projectStatus === 'empty' ? 'Aucun projet disponible' : projectStatus === 'forbidden' ? 'Accès au projet refusé' : projectStatus === 'not-found' ? 'Projet introuvable' : 'Projet indisponible'}</h2>{projectError && <p role="alert">{projectError}</p>}</Card></div></Shell>;
  if (!canNavigate(project, path)) return <Shell darkMode={darkMode} setDarkMode={setDarkMode}><div className="api-state" role="alert">Accès à cette section indisponible.</div></Shell>;
  let page: ReactNode = <Overview />;
  if (path === '/documents') page = <DocumentsPage />;
  if (path.startsWith('/documents/')) page = <DocumentDetail id={decodeURIComponent(path.split('/')[2] ?? '')} exactRevisionId={path.split('/')[3] === 'revisions' ? decodeURIComponent(path.split('/')[4] ?? '') : undefined} />;
  if (path.startsWith('/revisions/')) page = <DocumentDetail id="" exactRevisionId={decodeURIComponent(path.split('/')[2] ?? '')} />;
  if (path === '/drawings') page = <DocumentsPage />;
  if (path === '/reviews') page = <ReviewsPage />;
  if (path.startsWith('/reviews/')) page = <ReviewDetail id={decodeURIComponent(path.split('/')[2] ?? '')} />;
  if (path === '/approvals') page = <ApprovalsPage />;
  if (path.startsWith('/approvals/')) page = <ApprovalDetail id={decodeURIComponent(path.split('/')[2] ?? '')} />;
  if (path === '/my-work') page = <MyWorkPage />;
  if (path === '/transmittals') page = <TransmissionsPage />;
  if (path === '/transmittals/new') page = <TransmissionComposer />;
  if (path.startsWith('/transmittals/') && path.endsWith('/edit')) page = <TransmissionComposer id={decodeURIComponent(path.split('/')[2] ?? '')} />;
  if (path.startsWith('/transmittals/') && !path.endsWith('/edit')) page = <TransmissionDetailPage id={decodeURIComponent(path.split('/')[2] ?? '')} />;
  if (['/organizations', '/reports', '/issues', '/settings'].includes(path)) page = <PlaceholderPage title={path.slice(1).replace('-', ' ')} />;
  return <Shell darkMode={darkMode} setDarkMode={setDarkMode}><Suspense fallback={<div className="page-frame"><EvoAsyncState state="loading" message="Chargement de la surface…" /></div>}><div key={project?.id}>{page}</div></Suspense></Shell>;
}

export default function App() {
  return <EvoRailProvider><AuthOrApplication /></EvoRailProvider>;
}
