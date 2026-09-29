import {ChevronDownIcon} from '@heroicons/react/24/outline';
import {useSideNavCollapse} from '@astryxdesign/core/SideNav';

type ProjectSwitcherProps = {
  onSelectProject: () => void;
};

export function ProjectSwitcher({onSelectProject}: ProjectSwitcherProps) {
  const {isCollapsed} = useSideNavCollapse();

  const switcher = (
    <button
      type="button"
      className="evorail-project-switcher"
      aria-label="Ouvrir le projet Ligne A · LNA"
      title={isCollapsed ? 'Ligne A · LNA' : undefined}
      data-state={isCollapsed ? 'collapsed' : 'expanded'}
      onClick={onSelectProject}>
      {isCollapsed ? (
        <span className="evorail-project-mark" aria-hidden="true">
          L
        </span>
      ) : (
        <>
          <span className="evorail-project-mark" aria-hidden="true">
            L
          </span>
          <span className="evorail-project-switcher-copy">
            <strong>Ligne A · LNA</strong>
            <small>Conception détaillée</small>
          </span>
          <ChevronDownIcon aria-hidden="true" />
        </>
      )}
    </button>
  );

  return <div className="evorail-project-switcher-shell" data-slot="project-switcher">{switcher}</div>;
}
