import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const JIRA_BASE_URL = "https://zucchettibr.atlassian.net";

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
    const secretEmail = Deno.env.get("JIRA_EMAIL") || "";
    const secretToken = Deno.env.get("JIRA_API_TOKEN") || "";

    let bodyEmail = "";
    let bodyToken = "";
    if (req.method !== "GET") {
      const body = await req.json().catch(() => ({}));
      bodyEmail = body?.jiraEmail ? String(body.jiraEmail) : "";
      bodyToken = body?.jiraApiToken ? String(body.jiraApiToken) : "";
    }

    const jiraEmail = bodyEmail || secretEmail;
    const jiraApiToken = bodyToken || secretToken;
    const credSource = bodyEmail && bodyToken ? "body" : (secretEmail && secretToken ? "secrets" : "none");

    if (!jiraEmail || !jiraApiToken) {
      return new Response(
        JSON.stringify({
          error:
            "Missing Jira credentials. Provide jiraEmail/jiraApiToken in request body (POC) or set JIRA_EMAIL/JIRA_API_TOKEN as Supabase secrets.",
          meta: { credSource },
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    const jql =
      'project=IA AND issuetype=Epic AND status IN ("AG. PRIORIZAÇÃO", "EM DEV PELO SOLICITANTE", "EM REFINAMENTO", "EM ANÁLISE") ORDER BY created DESC';

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
      "customfield_10016",
    ].join(",");

    const url = `${JIRA_BASE_URL}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=${encodeURIComponent(fields)}&maxResults=100`;

    const auth = btoa(`${jiraEmail}:${jiraApiToken}`);

    const jiraRes = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });

    if (!jiraRes.ok) {
      const body = await jiraRes.text();
      return new Response(JSON.stringify({ error: `Jira request failed: ${jiraRes.status}`, details: body }), {
        status: jiraRes.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const json = await jiraRes.json();
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
      customfield_10016: i?.fields?.customfield_10016,
    }));

    return new Response(JSON.stringify({ issues: mapped, meta: { credSource } }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
