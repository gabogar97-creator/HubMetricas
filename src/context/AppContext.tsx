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

export interface CollectionOkrKeyResult {
  id: number;
  okrKeyResultId: number;
  date: string;
  targetAtDate: number;
  valueObtained: number;
  observation?: string;
}

export interface OkrKeyResult {
  id: number;
  okrId: number;
  name: string;
  calcMemory?: string;
  source?: string;
  globalTarget?: number;
  Collections: CollectionOkrKeyResult[];
}

export interface OKR {
  id: number;
  baseYear: number;
  objectiveName: string;
  KeyResults: OkrKeyResult[];
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
  okrs: OKR[];
  loading: boolean;
  refreshData: () => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  deleteCollectionROI: (id: number) => Promise<void>;
  deleteCollectionNSM: (id: number) => Promise<void>;
  deleteNSM: (id: number) => Promise<void>;
  deleteOKR: (id: number) => Promise<void>;
  deleteOkrKeyResult: (id: number) => Promise<void>;
  deleteCollectionOkrKeyResult: (id: number) => Promise<void>;
  updateProject: (id: number, data: any) => Promise<void>;
  addProject: (data: any) => Promise<void>;
  updateCollectionROI: (id: number, data: any) => Promise<void>;
  updateCollectionNSM: (id: number, data: any) => Promise<void>;
  updateNSM: (id: number, data: any) => Promise<void>;
  addCollectionROI: (data: any) => Promise<void>;
  addNSM: (data: any) => Promise<void>;
  addCollectionNSM: (data: any) => Promise<void>;
  addOKR: (data: any) => Promise<any>;
  addOkrKeyResult: (data: any) => Promise<any>;
  updateOkrKeyResult: (id: number, data: any) => Promise<void>;
  addCollectionOkrKeyResult: (data: any) => Promise<any>;
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
  const [okrs, setOkrs] = useState<OKR[]>([]);
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

  const deleteOKR = async (id: number) => {
    const okr = okrs.find(o => o.id === id);
    const { error } = await supabase.from('okrs').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete OKR:', error);
      throw error;
    }
    await logAction('DELETE', 'OKR', id.toString(), okr);
    await refreshData();
  };

  const deleteOkrKeyResult = async (id: number) => {
    const kr = okrs.flatMap(o => o.KeyResults || []).find((k: any) => k.id === id);
    const { error } = await supabase.from('okr_key_results').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete OKR Key Result:', error);
      throw error;
    }
    await logAction('DELETE', 'OKRKeyResult', id.toString(), kr);
    await refreshData();
  };

  const deleteCollectionOkrKeyResult = async (id: number) => {
    const krCols = okrs.flatMap(o => o.KeyResults || []).flatMap((k: any) => k.Collections || []);
    const col = krCols.find((c: any) => c.id === id);
    const { error } = await supabase.from('collection_okr_key_results').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete OKR Key Result collection:', error);
      throw error;
    }
    await logAction('DELETE', 'CollectionOKRKeyResult', id.toString(), col);
    await refreshData();
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
      const projRes = await supabase
        .from('projects')
        .select(`
          *,
          collection_rois (*),
          nsms (*)
        `);

      if (projRes.error) {
        console.error('Supabase error fetching projects:', projRes.error);
        throw projRes.error;
      }

      const rawProjects = projRes.data || [];

      const projectIds = rawProjects.map((p: any) => p.id).filter((id: any) => id != null);
      const colRes = projectIds.length
        ? await supabase
            .from('collection_nsms')
            .select('*')
            .in('project_id', projectIds)
        : { data: [], error: null as any };

      if ((colRes as any).error) {
        console.error('Supabase error fetching collection NSMs:', (colRes as any).error);
        throw (colRes as any).error;
      }

      const collections = ((colRes as any).data || []) as any[];
      const byProjectId = new Map<number, any[]>();
      const byNsmId = new Map<number, any[]>();

      collections.forEach((c: any) => {
        if (c?.project_id != null) {
          const pid = Number(c.project_id);
          byProjectId.set(pid, [...(byProjectId.get(pid) || []), c]);
        }
        if (c?.nsm_id != null) {
          const nid = Number(c.nsm_id);
          byNsmId.set(nid, [...(byNsmId.get(nid) || []), c]);
        }
      });

      const projData = rawProjects.map((p: any) => {
        const mapped = mapProject(p);

        const projectCollections = byProjectId.get(mapped.id) || [];
        const hasNsmIdLink = mapped.NSMs?.some((n: any) => (byNsmId.get(n.id) || []).length > 0);

        mapped.NSMs = (mapped.NSMs || []).map((n: any) => {
          const direct = (byNsmId.get(n.id) || []).map((c: any) => ({
            ...c,
            nsmId: c.nsm_id ?? c.nsmId
          }));

          if (direct.length > 0) {
            return { ...n, CollectionNSMs: direct };
          }

          if (!hasNsmIdLink && (mapped.NSMs || []).length === 1) {
            const legacy = projectCollections.map((c: any) => ({
              ...c,
              nsmId: n.id
            }));
            return { ...n, CollectionNSMs: legacy };
          }

          return { ...n, CollectionNSMs: [] };
        });

        return mapped;
      });

      const projDataWithOkrs = [...projData];
      try {
        const okrRes = await supabase
          .from('okrs')
          .select('*');

        if (okrRes.error) throw okrRes.error;

        const rawOkrs = (okrRes.data || []) as any[];
        const okrIds = rawOkrs.map(o => o.id).filter((id: any) => id != null);

        const krRes = okrIds.length
          ? await supabase
              .from('okr_key_results')
              .select('*')
              .in('okr_id', okrIds)
          : { data: [], error: null as any };

        if ((krRes as any).error) throw (krRes as any).error;

        const krs = ((krRes as any).data || []) as any[];
        const krIds = krs.map(k => k.id).filter((id: any) => id != null);

        const colKrRes = krIds.length
          ? await supabase
              .from('collection_okr_key_results')
              .select('*')
              .in('okr_key_result_id', krIds)
          : { data: [], error: null as any };

        if ((colKrRes as any).error) throw (colKrRes as any).error;

        const krCols = ((colKrRes as any).data || []) as any[];

        const colsByKrId = new Map<number, any[]>();
        krCols.forEach((c: any) => {
          if (c?.okr_key_result_id == null) return;
          const id = Number(c.okr_key_result_id);
          colsByKrId.set(id, [...(colsByKrId.get(id) || []), c]);
        });

        const krsByOkrId = new Map<number, any[]>();
        krs.forEach((k: any) => {
          if (k?.okr_id == null) return;
          const id = Number(k.okr_id);
          const mappedKr: OkrKeyResult = {
            id: k.id,
            okrId: Number(k.okr_id),
            name: k.name,
            calcMemory: k.calc_memory,
            source: k.source,
            globalTarget: k.global_target,
            Collections: (colsByKrId.get(k.id) || []).map((c: any) => ({
              id: c.id,
              okrKeyResultId: Number(c.okr_key_result_id),
              date: c.date,
              targetAtDate: Number(c.target_at_date) || 0,
              valueObtained: Number(c.value_obtained) || 0,
              observation: c.observation
            }))
          };

          krsByOkrId.set(id, [...(krsByOkrId.get(id) || []), mappedKr]);
        });

        const mappedOkrs: OKR[] = rawOkrs.map((o: any) => {
          const oid = Number(o.id);
          return {
            id: oid,
            baseYear: Number(o.base_year) || new Date().getFullYear(),
            objectiveName: o.objective_name,
            KeyResults: (krsByOkrId.get(oid) || []) as OkrKeyResult[]
          };
        });

        setOkrs(mappedOkrs);
      } catch (e: any) {
        console.warn('Skipping OKR fetch (tables may not exist yet):', e?.message || e);
        setOkrs([]);
      }
      console.log('Fetched projects:', projData.length);
      setProjects(projDataWithOkrs);
      setGlobalNSMs([]);
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

  const addOKR = async (data: any) => {
    const payload: any = {
      base_year: data.baseYear,
      objective_name: data.objectiveName
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    const { data: okr, error } = await supabase
      .from('okrs')
      .insert([payload])
      .select()
      .single();
    if (error) {
      console.error('Failed to create OKR:', error);
      throw error;
    }
    await logAction('CREATE', 'OKR', okr?.id?.toString(), null, data);
    await refreshData();
    return okr;
  };

  const addOkrKeyResult = async (data: any) => {
    const payload: any = {
      okr_id: data.okrId,
      name: data.name,
      calc_memory: data.calcMemory,
      source: data.source,
      global_target: data.globalTarget
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    const { data: kr, error } = await supabase
      .from('okr_key_results')
      .insert([payload])
      .select()
      .single();
    if (error) {
      console.error('Failed to create OKR Key Result:', error);
      throw error;
    }
    await logAction('CREATE', 'OKRKeyResult', kr?.id?.toString(), null, data);
    await refreshData();
    return kr;
  };

  const updateOkrKeyResult = async (id: number, data: any) => {
    const payload: any = {
      name: data.name,
      calc_memory: data.calcMemory,
      source: data.source,
      global_target: data.globalTarget
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    const { error } = await supabase
      .from('okr_key_results')
      .update(payload)
      .eq('id', id);
    if (error) {
      console.error('Failed to update OKR Key Result:', error);
      throw error;
    }
    await logAction('UPDATE', 'OKRKeyResult', id.toString(), null, data);
    await refreshData();
  };

  const addCollectionOkrKeyResult = async (data: any) => {
    const payload: any = {
      okr_key_result_id: data.okrKeyResultId,
      date: data.date,
      target_at_date: data.targetAtDate,
      value_obtained: data.valueObtained,
      observation: data.observation
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    const { data: col, error } = await supabase
      .from('collection_okr_key_results')
      .insert([payload])
      .select()
      .single();
    if (error) {
      console.error('Failed to create OKR Key Result collection:', error);
      throw error;
    }
    await logAction('CREATE', 'CollectionOKRKeyResult', col?.id?.toString(), null, data);
    await refreshData();
    return col;
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
    if (!data?.projectId) {
      throw new Error('NSM must be linked to a project.');
    }
    const payload: any = {
      project_id: data.projectId,
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
    const nsm = projects.flatMap(p => p.NSMs || []).find(n => n.id === data.nsmId);
    const payload: any = {
      nsm_id: data.nsmId,
      project_id: nsm?.projectId,
      date: data.date,
      value: data.value
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
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
      projects, globalNSMs, okrs, loading, refreshData,
      deleteProject, deleteCollectionROI, deleteCollectionNSM, deleteNSM,
      deleteOKR, deleteOkrKeyResult, deleteCollectionOkrKeyResult,
      updateProject, addProject, updateCollectionROI, updateCollectionNSM, updateNSM,
      addCollectionROI, addNSM, addCollectionNSM,
      addOKR, addOkrKeyResult, updateOkrKeyResult, addCollectionOkrKeyResult,
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
