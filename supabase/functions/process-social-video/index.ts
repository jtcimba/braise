import '@supabase/functions-js/edge-runtime.d.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
  });
}

async function getUserFromJwt(jwt: string): Promise<string | null> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${jwt}`,
    },
  });
  if (!response.ok) return null;
  const data = await response.json();
  return typeof data.id === 'string' ? data.id : null;
}

async function insertJob(
  userId: string,
  platform: string,
): Promise<string | null> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/video_import_jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({user_id: userId, platform, status: 'processing'}),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data[0]?.id ?? null;
}

async function updateJob(
  jobId: string,
  updates: Record<string, unknown>,
): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/video_import_jobs?id=eq.${jobId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({...updates, updated_at: new Date().toISOString()}),
  });
}

async function fetchMetadata(
  url: string,
  platform: string,
): Promise<{description: string; title: string} | null> {
  const metadataServerUrl = Deno.env.get('METADATA_SERVER_URL');
  const metadataSecret = Deno.env.get('METADATA_SERVER_SECRET');

  if (!metadataServerUrl) {
    console.error('METADATA_SERVER_URL not configured');
    return null;
  }

  const headers: Record<string, string> = {'Content-Type': 'application/json'};
  if (metadataSecret) {
    headers['x-metadata-secret'] = metadataSecret;
  }

  const response = await fetch(`${metadataServerUrl}/metadata`, {
    method: 'POST',
    headers,
    body: JSON.stringify({url, platform}),
    signal: AbortSignal.timeout(35_000),
  });

  if (!response.ok) {
    console.error(
      'Metadata server error:',
      response.status,
      await response.text(),
    );
    return null;
  }

  const data = await response.json();
  return {description: data.description ?? '', title: data.title ?? ''};
}

async function callImportFromTranscript(
  caption: string,
  title: string,
  sourceUrl: string,
  jwt: string,
): Promise<{recipe: Record<string, unknown>; lowConfidence: boolean} | null> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/import-from-transcript`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({caption, title, sourceUrl}),
      signal: AbortSignal.timeout(30_000),
    },
  );

  if (!response.ok) {
    console.error(
      'import-from-transcript error:',
      response.status,
      await response.text(),
    );
    return null;
  }

  const data = await response.json();
  if (!data.recipe) return null;
  return {recipe: data.recipe, lowConfidence: data.lowConfidence ?? false};
}

async function processJob(
  jobId: string,
  url: string,
  platform: string,
  jwt: string,
): Promise<void> {
  try {
    const metadata = await fetchMetadata(url, platform);
    if (!metadata || !metadata.description) {
      await updateJob(jobId, {
        status: 'failed',
        error: 'Could not retrieve video description',
      });
      return;
    }

    const result = await callImportFromTranscript(
      metadata.description,
      metadata.title,
      url,
      jwt,
    );

    if (!result) {
      await updateJob(jobId, {
        status: 'failed',
        error: 'Could not extract recipe from video description',
      });
      return;
    }

    await updateJob(jobId, {
      status: 'ready_for_review',
      extracted_recipe: result.recipe,
      low_confidence: result.lowConfidence,
    });
  } catch (err) {
    console.error('processJob error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    await updateJob(jobId, {status: 'failed', error: errorMessage});
  }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {status: 204, headers: CORS_HEADERS});
  }

  if (req.method !== 'POST') {
    return jsonResponse({error: 'Method not allowed'}, 405);
  }

  const authHeader = req.headers.get('Authorization');
  const jwt = authHeader?.replace('Bearer ', '');
  if (!jwt) {
    return jsonResponse({error: 'Unauthorized'}, 401);
  }

  let url: string;
  let platform: string;

  try {
    const body = await req.json();
    url = typeof body.url === 'string' ? body.url : '';
    platform = typeof body.platform === 'string' ? body.platform : '';
  } catch {
    return jsonResponse({error: 'Invalid JSON body'}, 400);
  }

  if (!url || !platform) {
    return jsonResponse({error: 'url and platform are required'}, 400);
  }

  const userId = await getUserFromJwt(jwt);
  if (!userId) {
    return jsonResponse({error: 'Invalid or expired token'}, 401);
  }

  const jobId = await insertJob(userId, platform);
  if (!jobId) {
    return jsonResponse({error: 'Failed to create import job'}, 500);
  }

  const backgroundWork = processJob(jobId, url, platform, jwt);
  try {
    // @ts-ignore — Supabase EdgeRuntime global for background tasks
    EdgeRuntime.waitUntil(backgroundWork);
  } catch {
    backgroundWork.catch(err => console.error('Background job error:', err));
  }

  return jsonResponse({job_id: jobId}, 202);
});
