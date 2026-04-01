import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface RoiMethod {
  id: string;
  name: string;
  type: string;
  fields?: Array<{
    id: string;
    name: string;
    type: 'fixed' | 'variable';
    defaultValue?: number;
  }>;
  formula?: Array<{ type: 'field' | 'operator', value: string }>;
}

export interface CollectionNSM {
  id: number;
  nsmId: number;
  date: string;
  value: string;
}

export interface NSM {
  id: number;
  projectId: number;
  name: string;
  type?: string;
  target: string;
  CollectionNSMs: CollectionNSM[];
}

export interface CollectionROI {
  id: number;
  projectId: number;
  date: string;
  type: string;
  description: string;
  accumulatedQuantity: number;
  hours: number;
  hourlyRate: number;
  totalValue: number;
}

export interface Project {
  id: number;
  name: string;
  goLiveDate: string;
  monthlyCapacity: number;
  monthlySquadCost: number;
  formulaType: string;
  status: string;
  costFormula?: string;
  returnFormula?: string;
  roiMethods?: RoiMethod[];
  CollectionROIs: CollectionROI[];
  NSMs: NSM[];
}

interface AppContextType {
  projects: Project[];
  globalNSMs: NSM[];
  loading: boolean;
  refreshData: () => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  deleteCollectionROI: (id: number) => Promise<void>;
  deleteCollectionNSM: (id: number) => Promise<void>;
  deleteNSM: (id: number) => Promise<void>;
  updateProject: (id: number, data: any) => Promise<void>;
  addProject: (data: any) => Promise<void>;
  updateCollectionROI: (id: number, data: any) => Promise<void>;
  updateCollectionNSM: (id: number, data: any) => Promise<void>;
  updateNSM: (id: number, data: any) => Promise<void>;
  addCollectionROI: (data: any) => Promise<void>;
  addNSM: (data: any) => Promise<void>;
  addCollectionNSM: (data: any) => Promise<void>;
  hasNewLogs: boolean;
  clearNewLogs: () => void;
  logAction: (action: string, entity: string, entityId?: string, oldValue?: any, newValue?: any) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  console.log('--- AppProvider component starting render now (final check) ---');
  console.log('--- AppProvider component starting render now ---');
  console.log('--- AppProvider component starting render ---');
  console.log('Starting AppProvider component render...');
  console.log('AppProvider component rendering...');
  console.log('Rendering AppProvider...');
  const [projects, setProjects] = useState<Project[]>([]);
  const [globalNSMs, setGlobalNSMs] = useState<NSM[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNewLogs, setHasNewLogs] = useState(false);
  const { user } = useAuth();

  const clearNewLogs = () => setHasNewLogs(false);

  const logAction = async (action: string, entity: string, entityId?: string, oldValue?: any, newValue?: any) => {
    if (!user) return;
    try {
      // entity_id is a UUID in the database, but our IDs are numbers.
      // We omit it here to prevent "invalid input syntax for type uuid" errors.
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        action,
        entity,
        old_value: oldValue || null,
        new_value: newValue || null
      }]);
      setHasNewLogs(true);
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  };

  const refreshData = async () => {
    console.log('--- refreshData function starting now (final check 2) ---');
    console.log('--- refreshData function starting now (final check) ---');
    console.log('--- refreshData function starting now ---');
    console.log('--- refreshData function starting ---');
    console.log('Starting refreshData function...');
    console.log('refreshData function called...');
    console.log('Fetching data from backend...');
    try {
      const [projRes, nsmRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/nsm/global')
      ]);
      console.log('Project response status:', projRes.status);
      console.log('NSM response status:', nsmRes.status);
      const projData = await projRes.json();
      const nsmData = await nsmRes.json();
      console.log('Fetched projects:', projData.length);
      console.log('Fetched global NSMs:', nsmData.length);
      setProjects(Array.isArray(projData) ? projData : []);
      setGlobalNSMs(Array.isArray(nsmData) ? nsmData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: number) => {
    const project = projects.find(p => p.id === id);
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    await logAction('DELETE', 'Project', id.toString(), project);
    await refreshData();
  };

  const deleteCollectionROI = async (id: number) => {
    await fetch(`/api/collections/roi/${id}`, { method: 'DELETE' });
    await logAction('DELETE', 'CollectionROI', id.toString());
    await refreshData();
  };

  const deleteCollectionNSM = async (id: number) => {
    await fetch(`/api/collections/nsm/${id}`, { method: 'DELETE' });
    await logAction('DELETE', 'CollectionNSM', id.toString());
    await refreshData();
  };

  const deleteNSM = async (id: number) => {
    const nsm = globalNSMs.find(n => n.id === id) || projects.flatMap(p => p.NSMs).find(n => n.id === id);
    await fetch(`/api/nsm/${id}`, { method: 'DELETE' });
    await logAction('DELETE', 'NSM', id.toString(), nsm);
    await refreshData();
  };

  const updateProject = async (id: number, data: any) => {
    const oldProject = projects.find(p => p.id === id);
    await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await logAction('UPDATE', 'Project', id.toString(), oldProject, data);
    await refreshData();
  };
  
  const addProject = async (data: any) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const newProject = await res.json();
    await logAction('CREATE', 'Project', newProject.id?.toString(), null, data);
    await refreshData();
  };

  const updateCollectionROI = async (id: number, data: any) => {
    await fetch(`/api/collections/roi/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await logAction('UPDATE', 'CollectionROI', id.toString(), null, data);
    await refreshData();
  };

  const updateCollectionNSM = async (id: number, data: any) => {
    await fetch(`/api/collections/nsm/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await logAction('UPDATE', 'CollectionNSM', id.toString(), null, data);
    await refreshData();
  };

  const updateNSM = async (id: number, data: any) => {
    const oldNsm = globalNSMs.find(n => n.id === id) || projects.flatMap(p => p.NSMs).find(n => n.id === id);
    await fetch(`/api/nsm/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await logAction('UPDATE', 'NSM', id.toString(), oldNsm, data);
    await refreshData();
  };

  const addCollectionROI = async (data: any) => {
    const res = await fetch(`/api/collections/roi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const newRoi = await res.json();
    await logAction('CREATE', 'CollectionROI', newRoi.id?.toString(), null, data);
    await refreshData();
  };

  const addNSM = async (data: any) => {
    const res = await fetch(`/api/nsm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const newNsm = await res.json();
    await logAction('CREATE', 'NSM', newNsm.id?.toString(), null, data);
    await refreshData();
  };

  const addCollectionNSM = async (data: any) => {
    const res = await fetch(`/api/collections/nsm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const newCol = await res.json();
    await logAction('CREATE', 'CollectionNSM', newCol.id?.toString(), null, data);
    await refreshData();
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <AppContext.Provider value={{
      projects, globalNSMs, loading, refreshData,
      deleteProject, deleteCollectionROI, deleteCollectionNSM, deleteNSM,
      updateProject, addProject, updateCollectionROI, updateCollectionNSM, updateNSM,
      addCollectionROI, addNSM, addCollectionNSM,
      hasNewLogs, clearNewLogs, logAction
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    console.error('useAppContext must be used within an AppProvider');
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
