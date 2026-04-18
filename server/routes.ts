import { Express } from 'express';
import { supabase } from './supabase';

export function setupRoutes(app: Express) {
  console.log('--- setupRoutes function starting now (final check 2) ---');
  console.log('--- setupRoutes function starting now (final check) ---');
  console.log('--- setupRoutes function starting now ---');
  console.log('--- setupRoutes function starting ---');
  console.log('Starting setupRoutes function...');
  console.log('setupRoutes function called...');
  app.get('/api/projects', async (req, res) => {
    console.log('GET /api/projects - Fetching projects...');
    try {
      // Fetch projects with their related data
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          *,
          collection_rois (*),
          nsms (
            *,
            collection_nsms (*)
          )
        `);

      if (error) {
        console.error('Supabase error fetching projects:', error);
        throw error;
      }
      console.log('Successfully fetched projects:', projects?.length || 0);

      // Map snake_case to camelCase if needed, but the app might expect the same structure
      // Let's check if the frontend expects camelCase.
      // Based on the Sequelize models, it does.
      const mappedProjects = projects.map(p => ({
        ...p,
        goLiveDate: p.go_live_date,
        monthlyCapacity: p.monthly_capacity,
        monthlySquadCost: p.monthly_squad_cost,
        formulaType: p.formula_type,
        costFormula: p.cost_formula,
        returnFormula: p.return_formula,
        roiMethods: p.roi_methods,
        CollectionROIs: p.collection_rois?.map((r: any) => ({
          ...r,
          accumulatedQuantity: r.accumulated_quantity,
          hourlyRate: r.hourly_rate,
          totalValue: r.total_value,
          customData: r.custom_data
        })),
        NSMs: p.nsms?.map((n: any) => ({
          ...n,
          projectId: n.project_id,
          CollectionNSMs: n.collection_nsms?.map((c: any) => ({
            ...c,
            nsmId: c.nsm_id
          }))
        }))
      }));

      res.json(mappedProjects);
    } catch (error) {
      console.error('Supabase error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post('/api/projects', async (req, res) => {
    try {
      const { name, goLiveDate, monthlyCapacity, monthlySquadCost, formulaType, status, costFormula, returnFormula, roiMethods } = req.body;
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name,
          go_live_date: goLiveDate,
          monthly_capacity: monthlyCapacity,
          monthly_squad_cost: monthlySquadCost,
          formula_type: formulaType,
          status,
          cost_formula: costFormula,
          return_formula: returnFormula,
          roi_methods: roiMethods
        }])
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post('/api/collections/roi', async (req, res) => {
    try {
      const { projectId, date, type, description, accumulatedQuantity, hours, hourlyRate, totalValue, customData } = req.body;
      const { data, error } = await supabase
        .from('collection_rois')
        .insert([{
          project_id: projectId,
          date,
          type,
          description,
          accumulated_quantity: accumulatedQuantity,
          hours,
          hourly_rate: hourlyRate,
          total_value: totalValue,
          custom_data: customData
        }])
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/api/nsm/global', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('nsms')
        .select('*, collection_nsms (*)')
        .is('project_id', null);

      if (error) throw error;
      
      const mapped = data.map(n => ({
        ...n,
        CollectionNSMs: n.collection_nsms?.map((c: any) => ({
          ...c,
          nsmId: c.nsm_id
        }))
      }));

      res.json(mapped);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post('/api/nsm', async (req, res) => {
    try {
      const { projectId, name, type, target } = req.body;
      const { data, error } = await supabase
        .from('nsms')
        .insert([{
          project_id: projectId,
          name,
          type,
          target
        }])
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put('/api/nsm/:id', async (req, res) => {
    try {
      const { name, type, target } = req.body;
      const { data, error } = await supabase
        .from('nsms')
        .update({ name, type, target })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete('/api/nsm/:id', async (req, res) => {
    try {
      const { error } = await supabase
        .from('nsms')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post('/api/collections/nsm', async (req, res) => {
    try {
      const { nsmId, date, value } = req.body;
      const { data, error } = await supabase
        .from('collection_nsms')
        .insert([{
          nsm_id: nsmId,
          date,
          value
        }])
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete('/api/projects/:id', async (req, res) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete('/api/collections/roi/:id', async (req, res) => {
    try {
      const { error } = await supabase
        .from('collection_rois')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete('/api/collections/nsm/:id', async (req, res) => {
    try {
      const { error } = await supabase
        .from('collection_nsms')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put('/api/projects/:id', async (req, res) => {
    try {
      const { name, goLiveDate, monthlyCapacity, monthlySquadCost, formulaType, status, costFormula, returnFormula, roiMethods } = req.body;
      const { error } = await supabase
        .from('projects')
        .update({
          name,
          go_live_date: goLiveDate,
          monthly_capacity: monthlyCapacity,
          monthly_squad_cost: monthlySquadCost,
          formula_type: formulaType,
          status,
          cost_formula: costFormula,
          return_formula: returnFormula,
          roi_methods: roiMethods
        })
        .eq('id', req.params.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put('/api/collections/roi/:id', async (req, res) => {
    try {
      const { date, type, description, accumulatedQuantity, hours, hourlyRate, totalValue, customData } = req.body;
      const { error } = await supabase
        .from('collection_rois')
        .update({
          date,
          type,
          description,
          accumulated_quantity: accumulatedQuantity,
          hours,
          hourly_rate: hourlyRate,
          total_value: totalValue,
          custom_data: customData
        })
        .eq('id', req.params.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put('/api/collections/nsm/:id', async (req, res) => {
    try {
      const { date, value } = req.body;
      const { error } = await supabase
        .from('collection_nsms')
        .update({
          date,
          value
        })
        .eq('id', req.params.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/api/jira/prioritization-epics', async (req, res) => {
    try {
      const jiraEmail = process.env.JIRA_EMAIL;
      const jiraApiToken = process.env.JIRA_API_TOKEN;

      if (!jiraEmail || !jiraApiToken) {
        return res.status(500).json({ error: 'Missing Jira credentials. Set JIRA_EMAIL and JIRA_API_TOKEN in server environment.' });
      }

      const jql = 'project=IA AND issuetype=Epic AND status IN ("AG. PRIORIZAÇÃO", "EM DEV PELO SOLICITANTE", "EM REFINAMENTO", "EM ANÁLISE") ORDER BY created DESC';
      const fields = [
        'summary',
        'key',
        'description',
        'status',
        'created',
        'updated',
        'startDate',
        'endDate',
        'customfield_10848',
        'customfield_10849',
        'customfield_10851',
        'customfield_10852',
        'customfield_10853',
        'customfield_10016'
      ].join(',');

      const url = `https://zucchettibr.atlassian.net/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=${encodeURIComponent(fields)}&maxResults=100`;
      const auth = Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64');

      const jiraRes = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'application/json'
        }
      });

      if (!jiraRes.ok) {
        const body = await jiraRes.text();
        return res.status(jiraRes.status).json({ error: `Jira request failed: ${jiraRes.status}`, details: body });
      }

      const json: any = await jiraRes.json();
      const issues = (json?.issues || []) as any[];

      const mapped = issues.map((i: any) => ({
        id: i?.id,
        key: i?.key,
        summary: i?.fields?.summary,
        description: i?.fields?.description,
        status: i?.fields?.status?.name,
        created: i?.fields?.created,
        updated: i?.fields?.updated,
        startDate: i?.fields?.startDate,
        endDate: i?.fields?.endDate,
        customfield_10848: i?.fields?.customfield_10848,
        customfield_10849: i?.fields?.customfield_10849,
        customfield_10851: i?.fields?.customfield_10851,
        customfield_10852: i?.fields?.customfield_10852,
        customfield_10853: i?.fields?.customfield_10853,
        customfield_10016: i?.fields?.customfield_10016
      }));

      return res.json({ issues: mapped });
    } catch (error) {
      console.error('Failed to fetch Jira prioritization epics:', error);
      return res.status(500).json({ error: String(error) });
    }
  });
}
