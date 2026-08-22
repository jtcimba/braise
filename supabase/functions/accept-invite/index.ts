import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

  let body: {code?: string};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({error: 'Invalid request body'}), {
      status: 400,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  const code = body.code?.trim().toUpperCase();
  if (!code) {
    return new Response(JSON.stringify({error: 'code is required'}), {
      status: 400,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {autoRefreshToken: false, persistSession: false},
  });

  // Look up the household by invite code
  const {data: household, error: lookupError} = await admin
    .from('households')
    .select('id, primary_user_id')
    .eq('invite_code', code)
    .maybeSingle();

  if (lookupError || !household) {
    return new Response(
      JSON.stringify({error: 'Invalid or expired invite code'}),
      {
        status: 404,
        headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
      },
    );
  }

  if (household.primary_user_id === user.id) {
    return new Response(
      JSON.stringify({error: 'You cannot join your own household'}),
      {
        status: 400,
        headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
      },
    );
  }

  // Check how many members the target household already has (primary counts as 1)
  const {count: memberCount} = await admin
    .from('household_members')
    .select('*', {count: 'exact', head: true})
    .eq('household_id', household.id);

  if ((memberCount ?? 0) >= 2) {
    return new Response(
      JSON.stringify({error: 'This household is already full'}),
      {
        status: 409,
        headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
      },
    );
  }

  // If the caller has their own household, dissolve it only if they are the
  // sole member (i.e., it's a solo household). Reject if they are already sharing.
  const {data: callerMember} = await admin
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (callerMember) {
    const {count: callerHouseholdCount} = await admin
      .from('household_members')
      .select('*', {count: 'exact', head: true})
      .eq('household_id', callerMember.household_id);

    if ((callerHouseholdCount ?? 0) > 1) {
      return new Response(
        JSON.stringify({
          error: 'You are already sharing a household with someone',
        }),
        {
          status: 409,
          headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
        },
      );
    }

    // Dissolve solo household (cascades to grocery_list_items)
    await admin.from('households').delete().eq('id', callerMember.household_id);
  }

  // Add the user to the new household
  const {error: insertError} = await admin
    .from('household_members')
    .insert({household_id: household.id, user_id: user.id, email: user.email});

  if (insertError) {
    return new Response(JSON.stringify({error: 'Failed to join household'}), {
      status: 500,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  // Invalidate the invite code
  await admin
    .from('households')
    .update({invite_code: null, invite_code_created_at: null})
    .eq('id', household.id);

  return new Response(JSON.stringify({success: true}), {
    status: 200,
    headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
  });
});
