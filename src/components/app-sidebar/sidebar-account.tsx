import {Avatar} from '@astryxdesign/core/Avatar';
import {SideNavItem, SideNavSection} from '@astryxdesign/core/SideNav';

type SidebarAccountProps = {
  onNavigate: (href: string) => void;
};

export function SidebarAccount({onNavigate}: SidebarAccountProps) {
  return (
    <div className="evorail-account-footer" data-slot="sidebar-account">
      <SideNavSection title="Compte" isHeaderHidden>
        <SideNavItem
          label="Sara Mehdi"
          icon={<Avatar name="Sara Mehdi" size="sm" tooltip={false} aria-hidden="true" />}
          href="/signin"
          onClick={event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            onNavigate('/signin');
          }}
        />
      </SideNavSection>
    </div>
  );
}
