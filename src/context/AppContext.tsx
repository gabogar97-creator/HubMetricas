import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    await refreshData();
  };

  const deleteCollectionROI = async (id: number) => {
    await fetch(`/api/collections/roi/${id}`, { method: 'DELETE' });
    await refreshData();
  };

  const deleteCollectionNSM = async (id: number) => {
    await fetch(`/api/collections/nsm/${id}`, { method: 'DELETE' });
    await refreshData();
  };

  const deleteNSM = async (id: number) => {
    await fetch(`/api/nsm/${id}`, { method: 'DELETE' });
    await refreshData();
  };

  const updateProject = async (id: number, data: any) => {
    await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await refreshData();
  };
  
  const addProject = async (data: any) => {
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await refreshData();
  };

  const updateCollectionROI = async (id: number, data: any) => {
    await fetch(`/api/collections/roi/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await refreshData();
  };

  const updateCollectionNSM = async (id: number, data: any) => {
    await fetch(`/api/collections/nsm/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await refreshData();
  };

  const updateNSM = async (id: number, data: any) => {
    await fetch(`/api/nsm/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await refreshData();
  };

  const addCollectionROI = async (data: any) => {
    await fetch(`/api/collections/roi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await refreshData();
  };

  const addNSM = async (data: any) => {
    await fetch(`/api/nsm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await refreshData();
  };

  const addCollectionNSM = async (data: any) => {
    await fetch(`/api/collections/nsm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
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
      addCollectionROI, addNSM, addCollectionNSM
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
