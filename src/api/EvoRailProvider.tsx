import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {ApiError, evoRailApi, subscribeApiFailures, type ApiDocument, type ApiProject, type ApiUser} from './evoRailApi';
import {canonicalizeProjectLocation, projectIdFromLocation, writeProjectLocation} from './projectLocation';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'session-expired' | 'backend-unavailable' | 'forbidden' | 'error';
export type ProjectStatus = 'loading' | 'ready' | 'empty' | 'forbidden' | 'not-found' | 'error';
type ProjectContextValue = {
  projects: ApiProject[];
  project: ApiProject | null;
  projectStatus: ProjectStatus;
  projectError: string | null;
  selectProject: (id: string) => Promise<void>;
};
type EvoRailContextValue = ProjectContextValue & {
  user: ApiUser | null;
  status: AuthStatus;
  documents: ApiDocument[];
  loading: boolean;
  error: string | null;
  authenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};
const EvoRailContext = createContext<EvoRailContextValue | null>(null);
const ProjectContext = createContext<ProjectContextValue | null>(null);

export function EvoRailProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [project, setProject] = useState<ApiProject | null>(null);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>('loading');
  const [projectError, setProjectError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const session = useRef(0);
  const selection = useRef(0);
  const knownUser = useRef<ApiUser | null>(null);
  const selectedId = useRef<string | null>(null);

  const clearProject = useCallback(() => {
    selection.current++;
    selectedId.current = null;
    setProject(null);
    setProjects([]);
    setDocuments([]);
    setProjectError(null);
    setProjectStatus('empty');
  }, []);

  const handleFailure = useCallback((cause: unknown, bootstrap = false) => {
    const failure = cause instanceof ApiError ? cause : new ApiError('EvoRail API is unavailable.');
    if (failure.status === 401 || failure.status === 419) {
      session.current++;
      setStatus(!bootstrap && knownUser.current ? 'session-expired' : 'unauthenticated');
      knownUser.current = null;
      setUser(null);
      clearProject();
    } else if (failure.unavailable) {
      // Retain user identity, but block protected content until the server recovers.
      setStatus('backend-unavailable');
      setProjectStatus('error');
      selection.current++;
      setProject(null);
      setDocuments([]);
    } else {
      setStatus(failure.status === 403 ? 'forbidden' : 'error');
    }
    setError(failure.message);
  }, [clearProject]);

  useEffect(() => subscribeApiFailures(failure => {
    if (failure.status === 401 || failure.status === 419 || failure.unavailable) handleFailure(failure);
  }), [handleFailure]);

  const loadProject = useCallback(async (id: string) => {
    const request = ++selection.current;
    selectedId.current = id;
    setProject(null);
    setDocuments([]);
    setProjectStatus('loading');
    setProjectError(null);
    try {
      const loaded = await evoRailApi.project(id, false);
      if (request !== selection.current) return;
      if (loaded.permissions?.viewProject !== true) throw new ApiError('Accès au projet refusé.', 403);
      setProject(loaded);
      setProjectStatus('ready');
      window.localStorage.setItem('evorail.projectId', loaded.id);
      // M2 bootstrap ends at project detail; document queries belong to their page.
    } catch (cause) {
      if (request !== selection.current) return;
      const failure = cause as ApiError;
      if (failure.status === 401 || failure.status === 419 || failure.unavailable) { handleFailure(failure); return; }
      setProjectStatus(failure.status === 403 ? 'forbidden' : failure.status === 404 ? 'not-found' : 'error');
      setProjectError(failure.message);
      setDocuments([]);
    }
  }, [handleFailure]);

  const loadProjects = useCallback(async (epoch: number) => {
    const items = await evoRailApi.projects(false);
    if (epoch !== session.current) return;
    setProjects(items);
    const explicit = projectIdFromLocation();
    const saved = window.localStorage.getItem('evorail.projectId');
    // An explicit deep link is validated, never silently replaced by another project.
    const id = explicit ?? items.find(item => item.id === saved)?.id ?? items[0]?.id;
    if (id) {
      if (!explicit) canonicalizeProjectLocation(id);
      await loadProject(id);
    }
    else { setProject(null); setProjectStatus('empty'); }
  }, [loadProject]);

  const refresh = useCallback(async () => {
    const epoch = ++session.current;
    clearProject();
    setStatus('loading');
    setError(null);
    try {
      const currentUser = await evoRailApi.me(false);
      if (epoch !== session.current) return;
      knownUser.current = currentUser;
      setUser(currentUser);
      setStatus('authenticated');
      await loadProjects(epoch);
    } catch (cause) {
      if (epoch === session.current) handleFailure(cause, !knownUser.current);
    }
  }, [clearProject, handleFailure, loadProjects]);

  useEffect(() => {
    void refresh();
    return () => { session.current++; selection.current++; };
  }, [refresh]);

  useEffect(() => {
    const onLocation = () => {
      const id = projectIdFromLocation();
      if (knownUser.current && id && id !== selectedId.current) void loadProject(id);
    };
    window.addEventListener('popstate', onLocation);
    return () => window.removeEventListener('popstate', onLocation);
  }, [loadProject]);

  const signIn = useCallback(async (email: string, password: string) => {
    const epoch = ++session.current;
    try {
      const currentUser = await evoRailApi.login(email, password);
      if (epoch !== session.current) return;
      clearProject();
      knownUser.current = currentUser;
      setUser(currentUser);
      setStatus('authenticated');
      setError(null);
      await loadProjects(epoch);
    } catch (cause) {
      if (epoch === session.current) handleFailure(cause, true);
      throw cause;
    }
  }, [clearProject, handleFailure, loadProjects]);

  const signOut = useCallback(async () => {
    try {
      await evoRailApi.logout(false);
      session.current++;
      knownUser.current = null;
      setUser(null);
      setStatus('unauthenticated');
      setError(null);
      clearProject();
      window.localStorage.removeItem('evorail.projectId');
    } catch (cause) {
      handleFailure(cause);
      throw cause;
    }
  }, [clearProject, handleFailure]);

  const selectProject = useCallback(async (id: string) => {
    if (status !== 'authenticated') return;
    await loadProject(id);
    // Updating the URL after validation keeps back/forward navigation coherent.
    if (selectedId.current === id) writeProjectLocation(id);
  }, [loadProject, status]);

  const projectValue = useMemo(() => ({projects, project, projectStatus, projectError, selectProject}), [projects, project, projectStatus, projectError, selectProject]);
  const value = useMemo(() => ({...projectValue, user, status, documents, loading: status === 'loading' || projectStatus === 'loading', error, authenticated: status === 'authenticated', signIn, signOut, refresh}), [documents, projectValue, user, status, projectStatus, error, signIn, signOut, refresh]);
  return <EvoRailContext.Provider value={value}><ProjectContext.Provider value={projectValue}>{children}</ProjectContext.Provider></EvoRailContext.Provider>;
}

export function useEvoRail() {
  const context = useContext(EvoRailContext);
  if (!context) throw new Error('useEvoRail must be used within EvoRailProvider');
  return context;
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProjectContext must be used within EvoRailProvider');
  return context;
}
