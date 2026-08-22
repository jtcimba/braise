import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (const b of bytes) {
    code += chars[b % chars.length];
  }
  return code;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {status: 204, headers: CORS_HEADERS});
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({error: 'Method not allowed'}), {
      status: 405,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({error: 'Missing or invalid Authorization header'}),
      {
        status: 401,
        headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
      },
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {headers: {Authorization: authHeader}},
    auth: {autoRefreshToken: false, persistSession: false},
  });

  const {
    data: {user},
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({error: 'Unauthorized'}), {
      status: 401,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {autoRefreshToken: false, persistSession: false},
  });

  // Caller must be the primary of their household
  const {data: household, error: householdError} = await admin
    .from('households')
    .select('id')
    .eq('primary_user_id', user.id)
    .single();

  if (householdError || !household) {
    return new Response(JSON.stringify({error: 'Household not found'}), {
      status: 404,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  const code = randomCode();

  const {error: updateError} = await admin
    .from('households')
    .update({
      invite_code: code,
      invite_code_created_at: new Date().toISOString(),
    })
    .eq('id', household.id);

  if (updateError) {
    return new Response(JSON.stringify({error: 'Failed to generate invite'}), {
      status: 500,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  return new Response(JSON.stringify({code}), {
    status: 200,
    headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
  });
});
