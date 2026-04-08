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

  const mapNsm = (n: any): NSM => ({
    ...n,
    projectId: n.project_id,
    CollectionNSMs: (n.collection_nsms || n.CollectionNSMs || []).map((c: any) => ({
      ...c,
      nsmId: c.nsm_id ?? c.nsmId
    }))
  });

  const mapProject = (p: any): Project => ({
    ...p,
    goLiveDate: p.go_live_date,
    monthlyCapacity: p.monthly_capacity,
    monthlySquadCost: p.monthly_squad_cost,
    formulaType: p.formula_type,
    costFormula: p.cost_formula,
    returnFormula: p.return_formula,
    roiMethods: p.roi_methods,
    CollectionROIs: (p.collection_rois || p.CollectionROIs || []).map((r: any) => ({
      ...r,
      projectId: r.project_id,
      accumulatedQuantity: r.accumulated_quantity,
      hourlyRate: r.hourly_rate,
      totalValue: r.total_value
    })),
    NSMs: (p.nsms || p.NSMs || []).map((n: any) => mapNsm(n))
  });

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
    console.log('Fetching data from Supabase...');
    try {
      const [projRes, nsmRes] = await Promise.all([
        supabase
          .from('projects')
          .select(`
            *,
            collection_rois (*),
            nsms (
              *,
              collection_nsms (*)
            )
          `),
        supabase
          .from('nsms')
          .select(`*, collection_nsms (*)`)
          .is('project_id', null)
      ]);

      if (projRes.error) {
        console.error('Supabase error fetching projects:', projRes.error);
        throw projRes.error;
      }
      if (nsmRes.error) {
        console.error('Supabase error fetching global NSMs:', nsmRes.error);
        throw nsmRes.error;
      }

      const projData = (projRes.data || []).map(mapProject);
      const nsmData = (nsmRes.data || []).map(mapNsm);
      console.log('Fetched projects:', projData.length);
      console.log('Fetched global NSMs:', nsmData.length);
      setProjects(projData);
      setGlobalNSMs(nsmData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: number) => {
    const project = projects.find(p => p.id === id);
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
    await logAction('DELETE', 'Project', id.toString(), project);
    await refreshData();
  };

  const deleteCollectionROI = async (id: number) => {
    const { error } = await supabase.from('collection_rois').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete collection ROI:', error);
      throw error;
    }
    await logAction('DELETE', 'CollectionROI', id.toString());
    await refreshData();
  };

  const deleteCollectionNSM = async (id: number) => {
    const { error } = await supabase.from('collection_nsms').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete collection NSM:', error);
      throw error;
    }
    await logAction('DELETE', 'CollectionNSM', id.toString());
    await refreshData();
  };

  const deleteNSM = async (id: number) => {
    const nsm = globalNSMs.find(n => n.id === id) || projects.flatMap(p => p.NSMs).find(n => n.id === id);
    const { error } = await supabase.from('nsms').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete NSM:', error);
      throw error;
    }
    await logAction('DELETE', 'NSM', id.toString(), nsm);
    await refreshData();
  };

  const updateProject = async (id: number, data: any) => {
    const oldProject = projects.find(p => p.id === id);
    const payload: any = {
      name: data.name,
      go_live_date: data.goLiveDate,
      monthly_capacity: data.monthlyCapacity,
      monthly_squad_cost: data.monthlySquadCost,
      formula_type: data.formulaType,
      status: data.status,
      cost_formula: data.costFormula,
      return_formula: data.returnFormula,
      roi_methods: data.roiMethods
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    const { error } = await supabase.from('projects').update(payload).eq('id', id);
    if (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
    await logAction('UPDATE', 'Project', id.toString(), oldProject, data);
    await refreshData();
  };
  
  const addProject = async (data: any) => {
    const payload: any = {
      name: data.name,
      go_live_date: data.goLiveDate,
      monthly_capacity: data.monthlyCapacity,
      monthly_squad_cost: data.monthlySquadCost,
      formula_type: data.formulaType,
      status: data.status,
      cost_formula: data.costFormula,
      return_formula: data.returnFormula,
      roi_methods: data.roiMethods
    };
    const { data: newProject, error } = await supabase
      .from('projects')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Failed to create project:', error);
      throw error;
    }

    await logAction('CREATE', 'Project', newProject?.id?.toString(), null, data);
    await refreshData();
  };

  const updateCollectionROI = async (id: number, data: any) => {
    const payload: any = {
      date: data.date,
      type: data.type,
      description: data.description,
      accumulated_quantity: data.accumulatedQuantity,
      hours: data.hours,
      hourly_rate: data.hourlyRate,
      total_value: data.totalValue,
      custom_data: data.customData
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    const { error } = await supabase.from('collection_rois').update(payload).eq('id', id);
    if (error) {
      console.error('Failed to update collection ROI:', error);
      throw error;
    }
    await logAction('UPDATE', 'CollectionROI', id.toString(), null, data);
    await refreshData();
  };

  const updateCollectionNSM = async (id: number, data: any) => {
    const payload: any = {
      date: data.date,
      value: data.value
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    const { error } = await supabase.from('collection_nsms').update(payload).eq('id', id);
    if (error) {
      console.error('Failed to update collection NSM:', error);
      throw error;
    }
    await logAction('UPDATE', 'CollectionNSM', id.toString(), null, data);
    await refreshData();
  };

  const updateNSM = async (id: number, data: any) => {
    const oldNsm = globalNSMs.find(n => n.id === id) || projects.flatMap(p => p.NSMs).find(n => n.id === id);
    const payload: any = {
      name: data.name,
      type: data.type,
      target: data.target
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    const { error } = await supabase.from('nsms').update(payload).eq('id', id);
    if (error) {
      console.error('Failed to update NSM:', error);
      throw error;
    }
    await logAction('UPDATE', 'NSM', id.toString(), oldNsm, data);
    await refreshData();
  };

  const addCollectionROI = async (data: any) => {
    const payload: any = {
      project_id: data.projectId,
      date: data.date,
      type: data.type,
      description: data.description,
      accumulated_quantity: data.accumulatedQuantity,
      hours: data.hours,
      hourly_rate: data.hourlyRate,
      total_value: data.totalValue,
      custom_data: data.customData
    };
    const { data: newRoi, error } = await supabase
      .from('collection_rois')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Failed to create collection ROI:', error);
      throw error;
    }

    await logAction('CREATE', 'CollectionROI', newRoi?.id?.toString(), null, data);
    await refreshData();
  };

  const addNSM = async (data: any) => {
    const payload: any = {
      project_id: data.projectId ?? null,
      name: data.name,
      type: data.type,
      target: data.target
    };
    const { data: newNsm, error } = await supabase
      .from('nsms')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Failed to create NSM:', error);
      throw error;
    }

    await logAction('CREATE', 'NSM', newNsm?.id?.toString(), null, data);
    await refreshData();
  };

  const addCollectionNSM = async (data: any) => {
    const payload: any = {
      nsm_id: data.nsmId,
      date: data.date,
      value: data.value
    };
    const { data: newCol, error } = await supabase
      .from('collection_nsms')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Failed to create collection NSM:', error);
      throw error;
    }

    await logAction('CREATE', 'CollectionNSM', newCol?.id?.toString(), null, data);
    await refreshData();
  };

  useEffect(() => {
    refreshData();
  }, [user?.id]);

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
