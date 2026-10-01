import {Divider} from '@astryxdesign/core/Divider';
import {Icon} from '@astryxdesign/core/Icon';
import {MoreMenu} from '@astryxdesign/core/MoreMenu';
import {NavIcon} from '@astryxdesign/core/NavIcon';
import {
  SideNav,
  SideNavHeading,
  SideNavItem,
  SideNavSection,
} from '@astryxdesign/core/SideNav';
import {
  ArchiveBoxIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  DocumentMagnifyingGlassIcon,
  DocumentTextIcon,
  LifebuoyIcon,
  PaperAirplaneIcon,
  QuestionMarkCircleIcon,
  TableCellsIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';
import {projectHref} from '../../api/projectLocation';
import {useProjectContext} from '../../api/EvoRailProvider';
import {canNavigate} from '../../api/permissions';
import {ProjectSwitcher} from './project-switcher';
import {SidebarAccount} from './sidebar-account';

type AppSidebarProps = {
  pathname: string;
  onNavigate: (href: string) => void;
};

export function AppSidebar({pathname, onNavigate}: AppSidebarProps) {
  const {project} = useProjectContext();
  const visible = (href: string) => canNavigate(project, href);
  const itemClick = (href: string) => (event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (visible(href)) onNavigate(href);
  };

  return (
    <SideNav
      className="evorail-sidebar"
      collapsible={{buttonLabel: 'Réduire la barre latérale'}}
      resizable={{
        defaultWidth: 224,
        minWidth: 224,
        maxWidth: 320,
        autoSaveId: 'evorail-sidebar-v5',
      }}
      header={
        <>
        <SideNavHeading
          icon={
            <NavIcon
              icon={<Icon icon={BuildingOffice2Icon} size="sm" />}
            />
          }
          superheading="INFRASOFT"
          heading="EvoRail"
          subheading={project ? `${project.name} · ${project.code}` : "Aucun projet sélectionné"}
          headingHref={projectHref("/overview")}
          headerEndContent={
            <MoreMenu
              label="Options du projet"
              size="sm"
              items={[
                {label: 'Ouvrir l’aperçu', onClick: () => onNavigate('/overview')},

              ]}
            />
          }
        />
        <ProjectSwitcher />
        </>
      }
      footer={<SidebarAccount onNavigate={onNavigate} />}>
      {visible('/overview') && <SideNavSection title="Projet">
        <SideNavItem
          label="Aperçu"
          icon={ChartBarIcon}
          href={projectHref("/overview")}
          isSelected={pathname === '/' || pathname === '/overview'}
          onClick={itemClick('/overview')}
        />
        <SideNavItem
          label="Documents"
          icon={DocumentTextIcon}
          href={projectHref("/documents")}
          isSelected={pathname.startsWith('/documents')}
          onClick={itemClick('/documents')}
          collapsible={{defaultIsCollapsed: true}}
          actions={
            <MoreMenu
              label="Actions des documents"
              size="sm"
              items={[
                ...(project?.permissions?.createDocument === true ? [{label: 'Nouveau document', onClick: () => onNavigate('/documents')}, {label: 'Importer des documents', onClick: () => onNavigate('/documents')}] : []),
                {label: 'Exporter le registre', onClick: () => onNavigate('/documents')},
              ]}
            />
          }>
          <SideNavItem
            label="Registre documentaire"
            href={projectHref("/documents")}
            isSelected={pathname === '/documents' || pathname.startsWith('/documents/')}
            onClick={itemClick('/documents')}
          />
          <SideNavItem
            label="Documents en revue"
            href={projectHref("/reviews")}
            isSelected={pathname === '/reviews'}
            onClick={itemClick('/reviews')}
          />
        </SideNavItem>
        <SideNavItem
          label="Dessins"
          icon={TableCellsIcon}
          href={projectHref("/drawings")}
          isSelected={pathname === '/drawings'}
          onClick={itemClick('/drawings')}
        />
        <SideNavItem
          label="Transmissions"
          icon={PaperAirplaneIcon}
          href={projectHref("/transmittals")}
          isSelected={pathname === '/transmittals'}
          onClick={itemClick('/transmittals')}
        />
      </SideNavSection>}

      <Divider />

      {visible('/reviews') && <SideNavSection title="Flux de travail">
        <SideNavItem
          label="Avis"
          icon={DocumentMagnifyingGlassIcon}
          href={projectHref("/reviews")}
          isSelected={pathname === '/reviews'}
          endContent={<span className="evorail-nav-badge">13</span>}
          onClick={itemClick('/reviews')}
        />
        <SideNavItem
          label="Mon travail"
          icon={ClipboardDocumentListIcon}
          href={projectHref("/my-work")}
          isSelected={pathname === '/my-work'}
          onClick={itemClick('/my-work')}
        />
      </SideNavSection>}

      {visible('/documents') && <SideNavSection title="Ressources">
        <SideNavItem
          label="Support"
          icon={LifebuoyIcon}
          collapsible={{defaultIsCollapsed: false}}
          actions={
            <MoreMenu
              label="Actions du support"
              size="sm"
              items={[{label: 'Ouvrir les avis', onClick: () => onNavigate('/reviews')}]}
            />
          }>
          <SideNavItem
            label="Tickets"
            icon={TicketIcon}
            href={projectHref("/reviews")}
            isSelected={pathname === '/reviews'}
            onClick={itemClick('/reviews')}
          />
          <SideNavItem
            label="Documentation"
            icon={DocumentTextIcon}
            href={projectHref("/documents")}
            onClick={itemClick('/documents')}
          />

        </SideNavItem>
        <SideNavItem
          label="Archives"
          icon={ArchiveBoxIcon}
          href={projectHref("/documents")}
          onClick={itemClick('/documents')}
        />
      </SideNavSection>}

      {visible('/settings') && <SideNavSection title="Administration">
        <SideNavItem
          label="Organisations"
          icon={BuildingOffice2Icon}
          href={projectHref("/organizations")}
          isSelected={pathname === '/organizations'}
          onClick={itemClick('/organizations')}
        />
        <SideNavItem
          label="Paramètres"
          icon={Cog6ToothIcon}
          href={projectHref("/settings")}
          isSelected={pathname === '/settings'}
          onClick={itemClick('/settings')}
        />
      </SideNavSection>}
    </SideNav>
  );
}
