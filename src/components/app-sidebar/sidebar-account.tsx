import {useEvoRail} from '../../api/EvoRailProvider';
import {Avatar} from '@astryxdesign/core/Avatar';
import {MoreMenu} from '@astryxdesign/core/MoreMenu';
import {SideNavItem, SideNavSection} from '@astryxdesign/core/SideNav';
import {Cog6ToothIcon} from '@heroicons/react/24/outline';

type SidebarAccountProps = {
  onNavigate: (href: string) => void;
};

export function SidebarAccount({onNavigate}: SidebarAccountProps) {
  const {user, signOut} = useEvoRail();
  return (
    <div className="evorail-account-footer" data-slot="sidebar-account">
      <SideNavSection title="Compte" isHeaderHidden>
        <SideNavItem
          label={user?.name ?? "Compte"}
          icon={<Avatar name={user?.name ?? "Compte"} size="sm" tooltip={false} aria-hidden="true" />}
          href="/signin"
          actions={
            <MoreMenu
              label="Options du compte"
              size="sm"
              items={[
                {label: 'Mon profil', onClick: () => onNavigate('/signin')},
                {label: 'Se déconnecter', onClick: () => { void signOut().then(() => onNavigate('/signin')).catch(() => {}); }},
              ]}
            />
          }
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
