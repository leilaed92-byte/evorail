import {useState} from 'react';
import {ChevronDownIcon} from '@heroicons/react/24/outline';
import {useSideNavCollapse} from '@astryxdesign/core/SideNav';
import {useProjectContext} from '../../api/EvoRailProvider';

export function ProjectSwitcher() {
  const {isCollapsed} = useSideNavCollapse();
  const {project, projects, projectStatus, selectProject} = useProjectContext();
  const [open, setOpen] = useState(false);
  const label = project ? `${project.name} · ${project.code}` : 'Sélectionner un projet';
  return <div className="evorail-project-switcher-shell" data-slot="project-switcher">
    <button type="button" className="evorail-project-switcher" aria-label={label} title={isCollapsed ? label : undefined} aria-expanded={open} aria-controls="project-options" data-state={isCollapsed ? 'collapsed' : 'expanded'} onClick={() => setOpen(!open)}>
      <span className="evorail-project-mark" aria-hidden="true">{project?.code.slice(0, 1) ?? '—'}</span>
      {!isCollapsed && <><span className="evorail-project-switcher-copy"><strong>{label}</strong><small>{projectStatus === 'loading' ? 'Chargement…' : project?.phase ?? `${projects.length} projet(s)`}</small></span><ChevronDownIcon aria-hidden="true" /></>}
    </button>
    {open && <div id="project-options" className="evorail-project-options" aria-label="Projets disponibles">
      {projects.length === 0 && <p>Aucun projet disponible.</p>}
      {projects.map(item => <button key={item.id} type="button" aria-pressed={project?.id === item.id} disabled={projectStatus === 'loading' || item.permissions?.viewProject !== true} onClick={() => { setOpen(false); void selectProject(item.id); }}>{item.name} · {item.code}</button>)}
    </div>}
  </div>;
}
