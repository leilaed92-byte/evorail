import {useEffect, useMemo, useState, type ReactNode} from 'react';
import {AppShell} from '@astryxdesign/core/AppShell';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {CheckboxInput} from '@astryxdesign/core/CheckboxInput';
import {CommandPalette} from '@astryxdesign/core/CommandPalette';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {MoreMenu} from '@astryxdesign/core/MoreMenu';
import {
  SideNav,
  SideNavHeading,
  SideNavItem,
  SideNavSection,
} from '@astryxdesign/core/SideNav';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {TextInput} from '@astryxdesign/core/TextInput';
import {TopNav} from '@astryxdesign/core/TopNav';
import {Table, pixel, type TableColumn} from '@astryxdesign/core/Table';
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
  ChartBarIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  CircleStackIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentMagnifyingGlassIcon,
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
  TableCellsIcon,
  UserCircleIcon,
  UsersIcon,
  ViewColumnsIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type StatusKind = 'current' | 'review' | 'returned' | 'draft' | 'ifc' | 'overdue';

type DocumentRow = {
  id: string;
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

const documents: DocumentRow[] = [
  {
    id: 'LNA-EVO-TRK-DWG-S05-00188',
    title: 'Interface drainage de quai',
    type: 'Plan',
    discipline: 'Voie / Civil',
    revision: 'Rev C',
    status: 'review',
    statusLabel: 'En revue',
    suitability: 'Pour revue',
    owner: 'Leila Cherif',
    due: '25 sept. 2026',
    updated: '26 sept. 2026',
    overdue: true,
  },
  {
    id: 'LNA-EVO-TRK-DWG-S05-00142',
    title: 'Alignement de la voie — Section 05',
    type: 'Plan',
    discipline: 'Voie ferrée',
    revision: 'Rev D',
    status: 'ifc',
    statusLabel: 'Émis pour construction',
    suitability: 'IFC',
    owner: 'Leila Cherif',
    due: '—',
    updated: '24 sept. 2026',
  },
  {
    id: 'LNA-EVO-STR-CAL-S04-00017',
    title: 'Note de calcul du pont BR-017',
    type: 'Note de calcul',
    discipline: 'Structures',
    revision: 'Rev B',
    status: 'review',
    statusLabel: 'Avis client',
    suitability: 'Pour approbation',
    owner: 'Hugo Lambert',
    due: '06 oct. 2026',
    updated: '23 sept. 2026',
  },
  {
    id: 'LNA-EVO-STR-DWG-S04-00044',
    title: 'Agencement général du pont BR-017',
    type: 'Plan',
    discipline: 'Structures',
    revision: 'Rev A',
    status: 'returned',
    statusLabel: 'Retourné',
    suitability: 'Pour revue',
    owner: 'Hugo Lambert',
    due: '30 sept. 2026',
    updated: '22 sept. 2026',
  },
  {
    id: 'LNA-EVO-ARC-MDL-S05-00031',
    title: 'Maquette de coordination de la station S05',
    type: 'Maquette',
    discipline: 'Architecture',
    revision: 'Rev C',
    status: 'current',
    statusLabel: 'Actuel',
    suitability: 'Approuvé',
    owner: 'Nadia Rahal',
    due: '—',
    updated: '21 sept. 2026',
  },
  {
    id: 'LNA-EVO-ELC-SCH-S05-00009',
    title: 'Calendrier des systèmes basse tension',
    type: 'Calendrier',
    discipline: 'Électricité',
    revision: 'Rev B',
    status: 'draft',
    statusLabel: 'Brouillon',
    suitability: 'Pour information',
    owner: 'Samir Haddad',
    due: '09 oct. 2026',
    updated: '20 sept. 2026',
  },
  {
    id: 'LNA-EVO-GEO-RPT-S04-00012',
    title: "Rapport d'interprétation géotechnique",
    type: 'Rapport',
    discipline: 'Géotechnique',
    revision: 'Rev C',
    status: 'current',
    statusLabel: 'Actuel',
    suitability: 'Pour information',
    owner: 'Meriem Bensaid',
    due: '—',
    updated: '18 sept. 2026',
  },
];

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
  {id: 'transmittal', label: 'Créer une transmission', auxiliaryData: {group: 'Actions', aliases: ['package d émission']}},
  {id: 'work', label: 'Voir mon travail', auxiliaryData: {group: 'Navigation', aliases: ['assigné à moi']}},
  {id: 'settings', label: 'Ouvrir les paramètres du projet', auxiliaryData: {group: 'Administration', aliases: ['configuration']}},
];

const commandSource = createStaticSource(commands, {
  keywords: item => item.auxiliaryData?.aliases ?? [],
});

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
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

function documentColumns(showType = false, selection?: {selected: string[]; toggle: (id: string) => void; toggleAll: () => void}) {
  const columns: TableColumn<DocumentRow>[] = [];
  if (selection) {
    columns.push({
      key: 'select',
      header: <CheckboxInput label="Sélectionner tous les documents" isLabelHidden value={selection.selected.length === documents.length} onChange={selection.toggleAll} size="sm" />,
      width: pixel(48),
      renderCell: row => <CheckboxInput label={`Sélectionner ${row.id}`} isLabelHidden value={selection.selected.includes(row.id)} onChange={() => selection.toggle(row.id)} size="sm" />,
    });
  }
  columns.push(
    {
      key: 'document',
      header: 'Document',
      width: pixel(300),
      renderCell: row => (
        <button className="document-link" onClick={() => navigate(`/documents/${row.id}`)}>
          <span className="document-code">{row.id}</span>
          <span className="document-name">{row.title}</span>
        </button>
      ),
    },
    ...(showType ? [{key: 'type', header: 'Type', width: pixel(110), renderCell: (row: DocumentRow) => <span className="muted-cell">{row.type}</span>}] : []),
    {key: 'revision', header: 'Révision', width: pixel(88), renderCell: (row: DocumentRow) => <span className="revision-cell">{row.revision}</span>},
    {key: 'status', header: 'Statut', width: pixel(180), renderCell: (row: DocumentRow) => statusBadge(row)},
    {key: 'discipline', header: 'Discipline', width: pixel(140), renderCell: (row: DocumentRow) => <span>{row.discipline}</span>},
    {key: 'owner', header: 'Responsable', width: pixel(150), renderCell: (row: DocumentRow) => <span className="owner-cell"><Avatar name={row.owner} size="xsm" /><span>{row.owner}</span></span>},
    {key: 'due', header: 'Échéance', width: pixel(120), renderCell: (row: DocumentRow) => <span className={row.overdue ? 'overdue-text' : 'date-cell'}>{row.due}</span>},
    {key: 'updated', header: 'Mis à jour', width: pixel(124), renderCell: (row: DocumentRow) => <span className="date-cell">{row.updated}</span>},
    {key: 'actions', header: 'Actions', width: pixel(70), renderCell: row => <MoreMenu label={`Actions pour ${row.id}`} size="sm" items={[{label: 'Ouvrir le document', onClick: () => navigate(`/documents/${row.id}`)}, {label: 'Télécharger', onClick: () => {}}, {label: 'Partager', onClick: () => {}}]} />},
  );
  return columns;
}

function Shell({children, darkMode, setDarkMode}: {children: ReactNode; darkMode: boolean; setDarkMode: (value: boolean) => void}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const path = window.location.pathname;

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

  const selected = (href: string) => (href === '/overview' && (path === '/' || path === '/overview')) || path === href || (href === '/documents' && path.startsWith('/documents'));

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
                <div className="top-brand">
                  <span className="top-corporate">INFRASOFT</span>
                  <span className="brand-copy"><strong>EvoRail</strong><small>Ligne A · LNA</small></span>
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
                  <button className="profile-button" aria-label="Ouvrir le menu du compte"><Avatar name="Sara Mehdi" size="sm" /><span>Sara Mehdi</span><ChevronRightIcon /></button>
                </div>
              }
            />
          }
          sideNav={
            <SideNav
              collapsible={{buttonLabel: 'Réduire la navigation'}}
              resizable={{defaultWidth: 248, minWidth: 220, maxWidth: 320, autoSaveId: 'evorail-shell'}}
              header={<div className="side-brand-lockup"><button className="infrasoft-wordmark" onClick={() => navigate('/overview')}>INFRASOFT</button><strong>EvoRail</strong><small>Ingénierie infrastructure ferroviaire</small></div>}
              topContent={<div className="project-context"><span className="context-label">ESPACE PROJET</span><button onClick={() => navigate('/overview')}><span className="project-dot">L</span><span><strong>Ligne A · LNA</strong><small>Conception détaillée</small></span><ChevronRightIcon /></button></div>}
              footer={<SideNavSection title="Compte" isHeaderHidden><SideNavItem label="Sara Mehdi" icon={UserCircleIcon} href="/signin" /></SideNavSection>}
            >
              <SideNavSection title="PROJECT">
                <SideNavItem label="Aperçu" icon={ChartBarIcon} href="/overview" isSelected={selected('/overview')} />
                <SideNavItem label="Documents" icon={DocumentTextIcon} href="/documents" isSelected={selected('/documents')} />
                <SideNavItem label="Dessins" icon={TableCellsIcon} href="/drawings" isSelected={selected('/drawings')} />
                <SideNavItem label="Transmissions" icon={PaperAirplaneIcon} href="/transmittals" isSelected={selected('/transmittals')} />
              </SideNavSection>
              <SideNavSection title="WORKFLOW">
                <SideNavItem label="Avis" icon={DocumentMagnifyingGlassIcon} href="/reviews" isSelected={selected('/reviews')} endContent={<Badge label="13" variant="warning" />} />
                <SideNavItem label="Mon travail" icon={ClipboardDocumentListIcon} href="/my-work" />
              </SideNavSection>
              <SideNavSection title="ADMINISTRATION">
                <SideNavItem label="Organisations" icon={BuildingOffice2Icon} href="/organizations" />
                <SideNavItem label="Paramètres" icon={Cog6ToothIcon} href="/settings" isSelected={selected('/settings')} />
              </SideNavSection>
            </SideNav>
          }
        >
          <main className="v2-main">{children}</main>
        </AppShell>
        <CommandPalette
          isOpen={paletteOpen}
          onOpenChange={setPaletteOpen}
          label="Palette de commandes Infrasoft EvoRail"
          searchSource={commandSource}
          onValueChange={value => {
            setPaletteOpen(false);
            const target: Record<string, string> = {documents: '/documents', drawings: '/drawings', reviews: '/reviews', work: '/my-work', settings: '/settings', search: '/documents', transmittal: '/transmittals'};
            navigate(target[value] ?? '/overview');
          }}
          renderItem={(item, isSelected) => <div className={`command-item ${isSelected ? 'is-selected' : ''}`}><span>{item.label}</span><span className="command-hint">{item.auxiliaryData?.group}</span></div>}
          footer={<div className="command-footer"><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>Enter</kbd> Open</span><span><kbd>Esc</kbd> Close</span></div>}
        />
      </div>
    </Theme>
  );
}

function PageHeader({eyebrow, title, subtitle, actions}: {eyebrow?: string; title: string; subtitle?: ReactNode; actions?: ReactNode}) {
  return <header className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{actions && <div className="header-actions">{actions}</div>}</header>;
}

function Overview() {
  const [workflow, setWorkflow] = useState('all');
  const filtered = workflow === 'all' ? documents : documents.filter(row => row.status === workflow || (workflow === 'ifc' && row.suitability === 'IFC'));
  const summary = [['40', 'Documents contrôlés'], ['21', 'Actuels'], ['13', 'En revue'], ['3', 'Retournés'], ['1', 'En retard'], ['6', 'IFC']];

  return <div className="page-frame overview-page">
    <PageHeader eyebrow="PROGRAMME NATIONAL DES CHEMINS DE FER" title="Ligne A" subtitle={<><strong>Conception détaillée</strong><span className="header-divider">·</span>Client · Autorité nationale des chemins de fer</>} actions={<><Button label="Recherche" variant="secondary" size="sm" icon={<Icon icon={MagnifyingGlassIcon} size="sm" />} /><Button label="Filtrer" variant="secondary" size="sm" icon={<Icon icon={FunnelIcon} size="sm" />} /><Button label="Exporter" variant="secondary" size="sm" icon={<Icon icon={ArrowDownTrayIcon} size="sm" />} /><MoreMenu label="Plus d'actions projet" size="sm" items={[{label: 'Paramètres du projet', onClick: () => {}}, {label: 'Copier le lien du projet', onClick: () => {}}]} /></>} />
    <section className="summary-strip" aria-label="Project summary">{summary.map(([value, label]) => <div className="summary-item" key={label}><strong>{value}</strong><span>{label}</span></div>)}</section>
    <section className="workflow-section"><div className="section-heading"><div><div className="eyebrow">À TRAITER</div><h2>Documents à traiter</h2></div><span className="section-note">Mis à jour le 26 sept. 2026 · 09:42</span></div><div className="workflow-bar"><SegmentedControl value={workflow} onChange={setWorkflow} label="État du flux documentaire" size="sm" layout="hug"><SegmentedControlItem value="all" label="Tous 40" /><SegmentedControlItem value="review" label="En revue 13" /><SegmentedControlItem value="returned" label="Retournés 3" /><SegmentedControlItem value="draft" label="Brouillons 3" /><SegmentedControlItem value="current" label="Actuels 21" /><SegmentedControlItem value="ifc" label="IFC 6" /></SegmentedControl><Button label="Ouvrir le registre" variant="ghost" size="sm" href="/documents" icon={<Icon icon={ArrowTopRightOnSquareIcon} size="sm" />} /></div></section>
    <section className="queue-layout"><Card variant="default" padding={0} className="work-queue-card"><div className="table-toolbar"><div><h3>Documents prioritaires</h3><span>{filtered.length} enregistrements visibles</span></div><Button label="Voir tous les documents" variant="ghost" size="sm" href="/documents" /></div><div className="table-shell"><Table data={filtered} columns={documentColumns(true)} idKey="id" density="compact" dividers="rows" hasHover textOverflow="truncate" /></div><div className="table-footer"><span>Affichage de {filtered.length} documents sur 40</span><button onClick={() => navigate('/documents')}>Voir le registre complet <ChevronRightIcon /></button></div></Card><AttentionPanel /></section>
  </div>;
}

function AttentionPanel() {
  return <aside className="attention-panel"><div className="attention-heading"><div><div className="eyebrow">ATTENTION</div><h3>1 document en retard</h3></div><StatusDot variant="error" label="En retard" isPulsing /></div><div className="attention-document"><div className="attention-icon"><ExclamationTriangleIcon /></div><div><button className="document-link" onClick={() => navigate('/documents/LNA-EVO-TRK-DWG-S05-00188')}><span className="document-code">LNA-EVO-TRK-DWG-S05-00188</span><span className="document-name">Interface drainage de quai</span></button><p>Révision technique dépassée de 3 jours.</p></div></div><dl className="attention-meta"><div><dt>Échéance</dt><dd>25 septembre 2026</dd></div><div><dt>Responsable</dt><dd><Avatar name="Leila Cherif" size="xsm" /> Leila Cherif</dd></div></dl><Button label="Ouvrir le document" variant="secondary" size="sm" width="100%" onClick={() => navigate('/documents/LNA-EVO-TRK-DWG-S05-00188')} /></aside>;
}

function DocumentsPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);
  const filtered = useMemo(() => documents.filter(row => {
    const matchesQuery = `${row.id} ${row.title} ${row.discipline} ${row.owner}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === 'all' || row.status === status;
    return matchesQuery && matchesStatus;
  }), [query, status]);
  const toggle = (id: string) => setSelected(items => items.includes(id) ? items.filter(item => item !== id) : [...items, id]);
  const toggleAll = () => setSelected(selected.length === documents.length ? [] : documents.map(row => row.id));

  return <div className="page-frame register-page"><PageHeader eyebrow="REGISTRE DU PROJET" title="Documents" subtitle="Tous les documents contrôlés de la Ligne A" actions={<><Button label="Filtrer" variant="secondary" size="sm" icon={<Icon icon={FunnelIcon} size="sm" />} /><Button label="Colonnes" variant="secondary" size="sm" icon={<Icon icon={ViewColumnsIcon} size="sm" />} /><Button label="Exporter" variant="secondary" size="sm" icon={<Icon icon={ArrowDownTrayIcon} size="sm" />} /><Button label="Importer / Créer" variant="primary" size="sm" icon={<Icon icon={PlusIcon} size="sm" />} /></>} /><div className="register-toolbar"><div className="register-search"><TextInput label="Rechercher des documents" isLabelHidden value={query} onChange={setQuery} placeholder="Rechercher des documents, codes, titres…" startIcon={<Icon icon={MagnifyingGlassIcon} size="sm" />} size="md" /></div><div className="filter-chips"><button className={status === 'all' ? 'filter-chip is-active' : 'filter-chip'} onClick={() => setStatus('all')}>Tous <span>40</span></button><button className={status === 'review' ? 'filter-chip is-active' : 'filter-chip'} onClick={() => setStatus('review')}>En revue <span>13</span></button><button className={status === 'returned' ? 'filter-chip is-active' : 'filter-chip'} onClick={() => setStatus('returned')}>Retournés <span>3</span></button><button className={status === 'current' ? 'filter-chip is-active' : 'filter-chip'} onClick={() => setStatus('current')}>Actuels <span>21</span></button><button className="filter-chip">Plus de filtres <ChevronRightIcon /></button></div></div>{selected.length > 0 && <div className="bulk-bar"><span><strong>{selected.length}</strong> sélectionné(s)</span><Button label="Télécharger" variant="secondary" size="sm" icon={<Icon icon={ArrowDownTrayIcon} size="sm" />} /><Button label="Affecter" variant="secondary" size="sm" icon={<Icon icon={UsersIcon} size="sm" />} /><Button label="Plus" variant="ghost" size="sm" /><IconButton label="Effacer la sélection" icon={<Icon icon={XMarkIcon} size="sm" />} variant="ghost" onClick={() => setSelected([])} /></div>}<Card variant="default" padding={0} className="register-card"><div className="table-shell"><Table data={filtered} columns={documentColumns(true, {selected, toggle, toggleAll})} idKey="id" density="compact" dividers="rows" hasHover textOverflow="truncate" /></div><div className="table-footer"><span>Affichage de {filtered.length} documents sur 40</span><nav className="pagination" aria-label="Pages du registre documentaire"><button aria-label="Page précédente" disabled><ArrowLeftIcon /></button><button className="is-current">1</button><button>2</button><button>3</button><span>…</span><button>4</button><button aria-label="Page suivante"><ChevronRightIcon /></button></nav></div></Card></div>;
}

function DocumentDetail({id}: {id: string}) {
  const row = documents.find(item => item.id === id) ?? documents[0];
  const [tab, setTab] = useState('overview');
  return <div className="page-frame detail-page"><div className="breadcrumbs"><button onClick={() => navigate('/documents')}>Documents</button><ChevronRightIcon /><button onClick={() => navigate('/drawings')}>Dessins</button><ChevronRightIcon /><span>{row.id}</span></div><PageHeader eyebrow={`${row.type.toUpperCase()} · ${row.discipline.toUpperCase()}`} title={row.id} subtitle={<><span>{row.title}</span><span className="header-divider">·</span><strong>{row.revision}</strong><span className="header-divider">·</span>{statusBadge(row)}</>} actions={<><Button label="Télécharger" variant="secondary" size="sm" icon={<Icon icon={ArrowDownTrayIcon} size="sm" />} /><Button label="Partager" variant="secondary" size="sm" icon={<Icon icon={ShareIcon} size="sm" />} /><Button label="Soumettre à l'avis" variant="primary" size="sm" icon={<Icon icon={PaperAirplaneIcon} size="sm" />} /><MoreMenu label="Plus d'actions document" size="sm" items={[{label: 'Copier le lien du document', onClick: () => {}}, {label: 'Créer une transmission', onClick: () => {}}, {label: 'Archiver', onClick: () => {}}]} /></>} /><div className="detail-tabs"><TabList value={tab} onChange={setTab} aria-label="Sections du document" role="tablist" size="sm" hasDivider><Tab value="overview" label="Aperçu" /><Tab value="versions" label="Versions" /><Tab value="reviews" label="Avis" /><Tab value="comments" label="Commentaires" /><Tab value="transmittals" label="Transmissions" /><Tab value="history" label="Historique" /></TabList></div>{tab !== 'overview' ? <EmptyTab tab={tab} /> : <div className="detail-grid"><div className="detail-main"><section className="content-section"><div className="section-heading"><div><div className="eyebrow">APERÇU DU DOCUMENT</div><h2>{row.title}</h2></div><Badge label={row.revision} variant="info" /></div><div className="preview-surface"><DocumentTextIcon /><strong>Aperçu indisponible dans la version de démonstration</strong><span>Le fichier contrôlé est disponible pour les membres autorisés du projet.</span><Button label="Télécharger le fichier source" variant="secondary" size="sm" icon={<Icon icon={ArrowDownTrayIcon} size="sm" />} /></div></section><section className="content-section"><div className="section-heading"><div><div className="eyebrow">ACTIVITÉ</div><h2>Activité récente</h2></div><button className="text-button">Voir l'historique <ChevronRightIcon /></button></div><div className="activity-list"><ActivityItem icon={CheckCircleIcon} title="Soumis pour avis technique" by="Leila Cherif" date="26 sept. 2026 · 09:42" /><ActivityItem icon={PencilSquareIcon} title="Révision C téléversée" by="Leila Cherif" date="24 sept. 2026 · 16:18" /><ActivityItem icon={InformationCircleIcon} title="Commentaire ajouté : confirmer l'interface de drainage" by="Hugo Lambert" date="23 sept. 2026 · 11:06" /></div></section></div><aside className="detail-rail"><Card variant="default" padding={4} className="metadata-card"><div className="rail-heading"><h3>État du contrôle</h3><StatusDot variant={statusMeta[row.status].variant} label={row.statusLabel} /></div><div className="rail-status"><Badge label={row.statusLabel} variant={statusMeta[row.status].badge} /><Badge label={row.suitability} variant="neutral" /></div><dl className="metadata-list"><div><dt>Responsable</dt><dd><Avatar name={row.owner} size="sm" /><span>{row.owner}<small>Responsable de discipline</small></span></dd></div><div><dt>Révision</dt><dd>{row.revision}</dd></div><div><dt>Échéance</dt><dd className={row.overdue ? 'overdue-text' : ''}>{row.due}</dd></div><div><dt>Dernière mise à jour</dt><dd>{row.updated}</dd></div><div><dt>Type de document</dt><dd>{row.type}</dd></div><div><dt>Droits d'accès</dt><dd><ShieldCheckIcon /> Accès contrôlé au projet</dd></div></dl><Button label="Gérer les droits" variant="secondary" size="sm" width="100%" /></Card></aside></div>}</div>;
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
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) { setError('Enter your work email and password to continue.'); return; }
    setError('');
    setLoading(true);
    window.setTimeout(() => { setLoading(false); navigate('/overview'); }, 700);
  };
  return <Theme theme={theme} mode="light"><div className="auth-page"><section className="auth-identity"><div className="auth-brand"><span className="infrasoft-wordmark">INFRASOFT</span><span className="auth-product"><strong>EvoRail</strong><small>Contrôle documentaire ferroviaire</small></span></div><div className="auth-identity-copy"><div className="eyebrow">PROGRAMME NATIONAL DES CHEMINS DE FER</div><h1>Une source contrôlée pour chaque document de projet.</h1><p>Gérez les révisions, les avis, les transmissions et les statuts d'émission de la Ligne A avec une piste d'audit claire.</p><div className="auth-trust"><ShieldCheckIcon /><span>Espace d'ingénierie · Accès contrôlé</span></div></div><span className="auth-version">Infrasoft EvoRail · v2.0</span></section><main className="auth-panel"><div className="auth-panel-inner"><div className="mobile-auth-brand"><span className="infrasoft-wordmark">INFRASOFT</span><strong>EvoRail</strong></div><div className="auth-heading"><div className="eyebrow">BIENVENUE</div><h2>Se connecter à votre espace</h2><p>Utilisez votre compte d'organisation pour accéder à la Ligne A.</p></div><form onSubmit={submit} className="auth-form"><TextInput label="Adresse e-mail professionnelle" type="email" value={email} onChange={setEmail} placeholder="nom@organisation.com" autoComplete="email" isRequired status={error && !email ? {type: 'error', message: "L'adresse e-mail est obligatoire"} : undefined} /><div className="password-field"><div className="password-label"><label htmlFor="auth-password">Mot de passe</label><button type="button" onClick={() => {}}>Mot de passe oublié&nbsp;?</button></div><TextInput label="Mot de passe" isLabelHidden type={showPassword ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="Saisissez votre mot de passe" autoComplete="current-password" isRequired /><IconButton label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} icon={<Icon icon={showPassword ? EyeSlashIcon : EyeIcon} size="sm" />} variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)} /></div>{error && <div className="auth-error" role="alert"><ExclamationTriangleIcon /><span>{error === 'Enter your work email and password to continue.' ? 'Saisissez votre adresse e-mail professionnelle et votre mot de passe pour continuer.' : error}</span></div>}<Button label="Se connecter" type="submit" variant="primary" size="lg" width="100%" isLoading={loading} /><div className="auth-divider"><span>ou continuer avec</span></div><Button label="Continuer avec SSO" variant="secondary" size="lg" width="100%" icon={<Icon icon={BuildingOffice2Icon} size="sm" />} onClick={() => {}} /><div className="sso-row"><Button label="Google" variant="ghost" size="sm" width="100%" onClick={() => {}} /><Button label="Microsoft" variant="ghost" size="sm" width="100%" onClick={() => {}} /></div></form><p className="auth-admin-note">L'accès est géré par votre organisation.<br /><button onClick={() => {}}>Contacter votre administrateur</button> si vous avez besoin d'un compte.</p></div></main></div></Theme>;
}

function PlaceholderPage({title}: {title: string}) {
  return <div className="page-frame"><PageHeader eyebrow="PROJECT MODULE" title={title} subtitle="This module is connected to the shared enterprise shell." actions={<Button label="Return to overview" variant="secondary" size="sm" onClick={() => navigate('/overview')} />} /><Card variant="default" padding={6} className="empty-tab"><CircleStackIcon /><h2>Workspace surface ready</h2><p>Use the command palette or project navigation to continue through the controlled workflow.</p></Card></div>;
}

function AuthOrApplication() {
  const [path, setPath] = useState(window.location.pathname);
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => { const onPopState = () => setPath(window.location.pathname); window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState); }, []);
  if (path === '/signin') return <SignIn />;
  let page: ReactNode = <Overview />;
  if (path === '/documents') page = <DocumentsPage />;
  if (path.startsWith('/documents/')) page = <DocumentDetail id={decodeURIComponent(path.split('/')[2] ?? '')} />;
  if (path === '/drawings') page = <DocumentsPage />;
  if (['/reviews', '/transmittals', '/my-work', '/organizations', '/reports', '/issues', '/settings'].includes(path)) page = <PlaceholderPage title={path.slice(1).replace('-', ' ')} />;
  return <Shell darkMode={darkMode} setDarkMode={setDarkMode}>{page}</Shell>;
}

export default function App() {
  return <AuthOrApplication />;
}
