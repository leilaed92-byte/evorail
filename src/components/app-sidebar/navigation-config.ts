import type {IconType} from '@astryxdesign/core/Icon';
import {
  BuildingOffice2Icon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  DocumentMagnifyingGlassIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';

export type NavigationItem = {
  label: string;
  href: string;
  icon: IconType;
  badge?: number;
  matches?: (pathname: string) => boolean;
};

const matchesOverview = (pathname: string) =>
  pathname === '/' || pathname === '/overview';

const matchesDocuments = (pathname: string) =>
  pathname === '/documents' || pathname.startsWith('/documents/');

export const projectNavigation: NavigationItem[] = [
  {label: 'Aperçu', href: '/overview', icon: ChartBarIcon, matches: matchesOverview},
  {label: 'Documents', href: '/documents', icon: DocumentTextIcon, matches: matchesDocuments},
  {label: 'Dessins', href: '/drawings', icon: TableCellsIcon},
  {label: 'Transmissions', href: '/transmittals', icon: PaperAirplaneIcon},
];

export const workflowNavigation: NavigationItem[] = [
  {label: 'Avis', href: '/reviews', icon: DocumentMagnifyingGlassIcon, badge: 13},
  {label: 'Approbations', href: '/approvals', icon: DocumentMagnifyingGlassIcon},
  {label: 'Mon travail', href: '/my-work', icon: ClipboardDocumentListIcon},
];

export const administrationNavigation: NavigationItem[] = [
  {label: 'Organisations', href: '/organizations', icon: BuildingOffice2Icon},
  {label: 'Paramètres', href: '/settings', icon: Cog6ToothIcon},
];

export function isNavigationItemActive(item: NavigationItem, pathname: string) {
  return item.matches?.(pathname) ?? pathname === item.href;
}
