import {SideNavItem, SideNavSection} from '@astryxdesign/core/SideNav';
import {
  isNavigationItemActive,
  projectNavigation,
  workflowNavigation,
  type NavigationItem,
} from './navigation-config';

type NavPrimaryProps = {
  pathname: string;
  onNavigate: (href: string) => void;
};

function renderNavigationItem(
  item: NavigationItem,
  pathname: string,
  onNavigate: (href: string) => void,
) {
  return (
    <SideNavItem
      key={item.href}
      label={item.label}
      icon={item.icon}
      href={item.href}
      isSelected={isNavigationItemActive(item, pathname)}
      endContent={item.badge ? <span className="evorail-nav-badge">{item.badge}</span> : undefined}
      onClick={event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        onNavigate(item.href);
      }}
    />
  );
}

export function NavPrimary({pathname, onNavigate}: NavPrimaryProps) {
  return (
    <SideNavSection title="PROJECT" data-slot="primary-navigation">
      {projectNavigation.map(item => renderNavigationItem(item, pathname, onNavigate))}
    </SideNavSection>
  );
}

export function NavWorkflow({pathname, onNavigate}: NavPrimaryProps) {
  return (
    <SideNavSection title="WORKFLOW" data-slot="workflow-navigation">
      {workflowNavigation.map(item => renderNavigationItem(item, pathname, onNavigate))}
    </SideNavSection>
  );
}
