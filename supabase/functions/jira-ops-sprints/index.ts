import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: any;

const JIRA_BASE_URL = "https://zucchettibr.atlassian.net";
const BOARD_ID = 330;

type Action = "listSprints" | "bugs" | "throughput" | "spDone" | "spEstimate" | "spEstimateByKeys";

type RequestBody = {
  action?: Action;
  sprintId?: number | string;
  jiraEmail?: string;
  jiraApiToken?: string;
  keys?: string | string[];
};

type JiraSearchIssue = {
  id?: string;
  key?: string;
  fields?: Record<string, any>;
};

const parseKeysInput = (raw: any): string[] => {
  const input = Array.isArray(raw) ? raw.join(',') : String(raw ?? '');
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const jsonResponse = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      },
    });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse(405, { error: "Method not allowed. Use POST." });
    }

    const body = (await req.json().catch(() => ({}))) as RequestBody;

    const secretEmail = Deno.env.get("JIRA_EMAIL") || "";
    const secretToken = Deno.env.get("JIRA_API_TOKEN") || "";

    const bodyEmail = body?.jiraEmail ? String(body.jiraEmail) : "";
    const bodyToken = body?.jiraApiToken ? String(body.jiraApiToken) : "";

    const jiraEmail = bodyEmail || secretEmail;
    const jiraApiToken = bodyToken || secretToken;
    const credSource = bodyEmail && bodyToken ? "body" : secretEmail && secretToken ? "secrets" : "none";

    if (!jiraEmail || !jiraApiToken) {
      return jsonResponse(500, {
        error:
          "Missing Jira credentials. Provide jiraEmail/jiraApiToken in request body (POC) or set JIRA_EMAIL/JIRA_API_TOKEN as Supabase secrets.",
        meta: { credSource },
      });
    }

    const action = body?.action;
    if (!action) {
      return jsonResponse(400, { error: "Missing action.", meta: { credSource } });
    }

    const auth = btoa(`${jiraEmail}:${jiraApiToken}`);

    const fetchJira = async (url: string) => {
      const jiraRes = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      });

      if (!jiraRes.ok) {
        const details = await jiraRes.text();
        return { ok: false as const, status: jiraRes.status, details };
      }

      const json = await jiraRes.json();
      return { ok: true as const, json };
    };

    if (action === "listSprints") {
      const url = `${JIRA_BASE_URL}/rest/agile/1.0/board/${BOARD_ID}/sprint`;
      console.log(JSON.stringify({ tag: "jira-ops-sprints", action, url }));
      const res = await fetchJira(url);
      if (!res.ok) {
        return jsonResponse(res.status, { error: `Jira request failed: ${res.status}`, details: res.details });
      }

      const values = Array.isArray((res.json as any)?.values) ? (res.json as any).values : [];
      const sprints = values.map((s: any) => ({
        id: s?.id,
        name: s?.name,
        state: s?.state,
        startDate: s?.startDate,
        endDate: s?.endDate,
        completeDate: s?.completeDate,
      }));

      return jsonResponse(200, { sprints, meta: { credSource } });
    }

    const sprintIdRaw = body?.sprintId;
    const sprintId = sprintIdRaw == null ? null : Number(sprintIdRaw);
    if (!sprintId || Number.isNaN(sprintId)) {
      return jsonResponse(400, { error: "Missing or invalid sprintId.", meta: { credSource } });
    }

    console.log(JSON.stringify({ tag: "jira-ops-sprints", action, sprintId }));

    if (action === "bugs") {
      const jql = `project = IA AND type = Bug AND sprint = ${sprintId} ORDER BY created DESC`;
      const fields = [
        "summary",
        "key",
        "description",
        "status",
        "created",
        "updated",
        "startDate",
        "endDate",
        "customfield_10848",
        "customfield_10849",
        "customfield_10851",
        "customfield_10852",
        "customfield_10853",
        "customfield_10020",
      ].join(",");

      const url = `${JIRA_BASE_URL}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=${encodeURIComponent(fields)}&maxResults=100`;
      console.log(JSON.stringify({ tag: "jira-ops-sprints", action, sprintId, jql, url }));
      const res = await fetchJira(url);
      if (!res.ok) {
        return jsonResponse(res.status, { error: `Jira request failed: ${res.status}`, details: res.details });
      }

      const json: any = res.json as any;
      const issuesLen = Array.isArray(json?.issues) ? json.issues.length : 0;
      const totalRaw = json?.total;
      const totalNum = Number(totalRaw);
      const total = Number.isFinite(totalNum) ? totalNum : issuesLen;
      const warningMessages = Array.isArray(json?.warningMessages) ? json.warningMessages : [];
      const errorMessages = Array.isArray(json?.errorMessages) ? json.errorMessages : [];
      console.log(
        JSON.stringify({
          tag: "jira-ops-sprints",
          action,
          sprintId,
          total,
          totalRaw,
          issuesLen,
          warningMessages,
          errorMessages,
        }),
      );
      return jsonResponse(200, { total, meta: { credSource, issuesLen, totalRaw, warningMessages, errorMessages } });
    }

    if (action === "spDone") {
      const jql = `project = IA AND sprint = ${sprintId} AND type IN (Epic, Story, "Implementações") ORDER BY created DESC`;
      const fields = [
        "summary",
        "key",
        "status",
        "created",
        "updated",
        "startDate",
        "endDate",
        "customfield_10848",
        "customfield_10849",
        "customfield_10851",
        "customfield_10852",
        "customfield_10853",
        "customfield_10020",
        "customfield_10016",
      ].join(",");

      const url = `${JIRA_BASE_URL}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=${encodeURIComponent(fields)}&maxResults=100`;
      console.log(JSON.stringify({ tag: "jira-ops-sprints", action, sprintId, jql, url }));
      const res = await fetchJira(url);
      if (!res.ok) {
        return jsonResponse(res.status, { error: `Jira request failed: ${res.status}`, details: res.details });
      }

      const json: any = res.json as any;
      const issues = Array.isArray(json?.issues) ? json.issues : [];
      const sum = issues.reduce((acc: number, issue: any) => {
        const statusName = String(issue?.fields?.status?.name || '');
        if (statusName !== 'Concluído') return acc;
        const raw = issue?.fields?.customfield_10016;
        const n = raw == null ? 0 : Number(raw);
        return acc + (Number.isFinite(n) ? n : 0);
      }, 0);

      const issuesLen = issues.length;
      const totalRaw = json?.total;
      const warningMessages = Array.isArray(json?.warningMessages) ? json.warningMessages : [];
      const errorMessages = Array.isArray(json?.errorMessages) ? json.errorMessages : [];
      console.log(
        JSON.stringify({
          tag: "jira-ops-sprints",
          action,
          sprintId,
          sum,
          issuesLen,
          totalRaw,
          warningMessages,
          errorMessages,
        }),
      );
      return jsonResponse(200, { sum, meta: { credSource, issuesLen, totalRaw, warningMessages, errorMessages } });
    }

    if (action === "spEstimate") {
      const jql = `project = IA AND sprint = ${sprintId} AND type IN (Epic, Story, "Implementações") ORDER BY created DESC`;
      const fields = [
        "summary",
        "key",
        "status",
        "created",
        "updated",
        "startDate",
        "endDate",
        "customfield_10848",
        "customfield_10849",
        "customfield_10851",
        "customfield_10852",
        "customfield_10853",
        "customfield_10020",
        "customfield_10016",
      ].join(",");

      const url = `${JIRA_BASE_URL}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=${encodeURIComponent(fields)}&maxResults=100`;
      console.log(JSON.stringify({ tag: "jira-ops-sprints", action, sprintId, jql, url }));
      const res = await fetchJira(url);
      if (!res.ok) {
        return jsonResponse(res.status, { error: `Jira request failed: ${res.status}`, details: res.details });
      }

      const json: any = res.json as any;
      const issues = Array.isArray(json?.issues) ? json.issues : [];
      const notEstimatedIssues = issues
        .filter((issue: any) => {
          const statusName = String(issue?.fields?.status?.name || '');
          return statusName === 'Concluído' && issue?.fields?.customfield_10016 == null;
        })
        .map((issue: any) => ({
          key: issue?.key,
          summary: issue?.fields?.summary,
        }));

      const sum = issues.reduce((acc: number, issue: any) => {
        const raw = issue?.fields?.customfield_10016;
        const n = raw == null ? 0 : Number(raw);
        return acc + (Number.isFinite(n) ? n : 0);
      }, 0);

      const issuesLen = issues.length;
      const notEstimatedCount = notEstimatedIssues.length;
      const totalRaw = json?.total;
      const warningMessages = Array.isArray(json?.warningMessages) ? json.warningMessages : [];
      const errorMessages = Array.isArray(json?.errorMessages) ? json.errorMessages : [];
      console.log(
        JSON.stringify({
          tag: "jira-ops-sprints",
          action,
          sprintId,
          sum,
          issuesLen,
          notEstimatedCount,
          totalRaw,
          warningMessages,
          errorMessages,
        }),
      );

      return jsonResponse(200, {
        sum,
        notEstimatedCount,
        notEstimatedIssues,
        meta: { credSource, issuesLen, totalRaw, warningMessages, errorMessages },
      });
    }

    if (action === "spEstimateByKeys") {
      const keys = parseKeysInput(body?.keys);
      if (!keys.length) {
        return jsonResponse(200, { totalStoryPoints: 0, issueCount: 0, notEstimatedCount: 0, notEstimated: [] });
      }

      const quoted = keys.map((k) => `"${k.replace(/\"/g, '')}"`).join(',');
      const jql = `(("Epic Link" in (${quoted}) OR parent in (${quoted})) AND statusCategory = Done)`;
      const fields = ['key', 'summary', 'status', 'customfield_10016'].join(',');
      const maxResults = 100;
      let startAt = 0;
      let totalStoryPoints = 0;
      let issueCount = 0;
      const notEstimated: any[] = [];

      while (true) {
        const url = `https://zucchettibr.atlassian.net/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=${encodeURIComponent(fields)}&maxResults=${maxResults}&startAt=${startAt}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: 'application/json'
          }
        });

        if (!res.ok) {
          const t = await res.text();
          return jsonResponse(500, { error: `Jira request failed: ${res.status}`, details: t });
        }

        const json: any = await res.json();
        const issues = (json?.issues || []) as JiraSearchIssue[];

        issues.forEach((iss: any) => {
          issueCount += 1;
          const sp = iss?.fields?.customfield_10016;
          const spNum = sp == null ? null : Number(sp);
          if (spNum == null || Number.isNaN(spNum)) {
            notEstimated.push({
              key: iss?.key,
              summary: iss?.fields?.summary,
              status: iss?.fields?.status?.name
            });
          } else {
            totalStoryPoints += spNum;
          }
        });

        const total = Number(json?.total) || 0;
        startAt += issues.length;
        if (!issues.length || startAt >= total) break;
      }

      return jsonResponse(200, {
        keys,
        jql,
        totalStoryPoints,
        issueCount,
        notEstimatedCount: notEstimated.length,
        notEstimated
      });
    }

    if (action === "throughput") {
      const jql = `project = IA AND sprint = ${sprintId} AND type IN ("Implementações", Bug) AND status = "Concluído" ORDER BY created DESC`;
      const fields = [
        "summary",
        "key",
        "description",
        "status",
        "created",
        "updated",
        "startDate",
        "endDate",
        "customfield_10848",
        "customfield_10849",
        "customfield_10851",
        "customfield_10852",
        "customfield_10853",
        "customfield_10020",
      ].join(",");

      const url = `${JIRA_BASE_URL}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=${encodeURIComponent(fields)}&maxResults=100`;
      console.log(JSON.stringify({ tag: "jira-ops-sprints", action, sprintId, jql, url }));
      const res = await fetchJira(url);
      if (!res.ok) {
        return jsonResponse(res.status, { error: `Jira request failed: ${res.status}`, details: res.details });
      }

      const json: any = res.json as any;
      const issuesLen = Array.isArray(json?.issues) ? json.issues.length : 0;
      const totalRaw = json?.total;
      const totalNum = Number(totalRaw);
      const total = Number.isFinite(totalNum) ? totalNum : issuesLen;
      const warningMessages = Array.isArray(json?.warningMessages) ? json.warningMessages : [];
      const errorMessages = Array.isArray(json?.errorMessages) ? json.errorMessages : [];
      console.log(
        JSON.stringify({
          tag: "jira-ops-sprints",
          action,
          sprintId,
          total,
          totalRaw,
          issuesLen,
          warningMessages,
          errorMessages,
        }),
      );
      return jsonResponse(200, { total, meta: { credSource, issuesLen, totalRaw, warningMessages, errorMessages } });
    }

    return jsonResponse(400, { error: `Unsupported action: ${action}`, meta: { credSource } });
  } catch (e) {
    return jsonResponse(500, { error: String(e) });
  }
});
