import {SideNavItem, SideNavSection} from '@astryxdesign/core/SideNav';
import {
  administrationNavigation,
  isNavigationItemActive,
} from './navigation-config';

type NavAdministrationProps = {
  pathname: string;
  onNavigate: (href: string) => void;
};

export function NavAdministration({pathname, onNavigate}: NavAdministrationProps) {
  return (
    <SideNavSection title="ADMINISTRATION" data-slot="administration-navigation">
      {administrationNavigation.map(item => (
        <SideNavItem
          key={item.href}
          label={item.label}
          icon={item.icon}
          href={item.href}
          isSelected={isNavigationItemActive(item, pathname)}
          onClick={event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            onNavigate(item.href);
          }}
        />
      ))}
    </SideNavSection>
  );
}
