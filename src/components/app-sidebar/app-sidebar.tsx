import {SideNav} from '@astryxdesign/core/SideNav';
import {NavPrimary, NavWorkflow} from './nav-primary';
import {NavAdministration} from './nav-administration';
import {ProjectSwitcher} from './project-switcher';
import {SidebarAccount} from './sidebar-account';

type AppSidebarProps = {
  pathname: string;
  onNavigate: (href: string) => void;
};

export function AppSidebar({pathname, onNavigate}: AppSidebarProps) {
  return (
    <SideNav
      className="evorail-sidebar"
      collapsible={{buttonLabel: 'Réduire la barre latérale'}}
      resizable={{
        defaultWidth: 134,
        minWidth: 134,
        maxWidth: 134,
        autoSaveId: 'evorail-shell-density-v3',
      }}
      header={<ProjectSwitcher onSelectProject={() => onNavigate('/overview')} />}
      footer={<SidebarAccount onNavigate={onNavigate} />}>
      <NavPrimary pathname={pathname} onNavigate={onNavigate} />
      <NavWorkflow pathname={pathname} onNavigate={onNavigate} />
      <NavAdministration pathname={pathname} onNavigate={onNavigate} />
    </SideNav>
  );
}
