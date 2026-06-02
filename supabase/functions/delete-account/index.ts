import '@supabase/functions-js/edge-runtime.d.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {status: 204, headers: CORS_HEADERS});
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({error: 'Method not allowed'}), {
      status: 405,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  // Extract and verify JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({error: 'Missing or invalid Authorization header'}),
      {
        status: 401,
        headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
      },
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !serviceRoleKey || !supabaseAnonKey) {
    return new Response(JSON.stringify({error: 'Server configuration error'}), {
      status: 500,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }

  // Verify the JWT and get the user
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
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

  const uid = user.id;

  // Create admin client for privileged operations
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {autoRefreshToken: false, persistSession: false},
  });

  try {
    // Delete recipe images from storage
    const {data: storageFiles, error: listError} = await supabaseAdmin.storage
      .from('recipe_images')
      .list(uid);

    if (listError) {
      console.error('Error listing storage files:', listError);
      throw listError;
    }

    if (storageFiles && storageFiles.length > 0) {
      const filePaths = storageFiles.map(f => `${uid}/${f.name}`);
      const {error: storageError} = await supabaseAdmin.storage
        .from('recipe_images')
        .remove(filePaths);

      if (storageError) {
        console.error('Error deleting storage files:', storageError);
        throw storageError;
      }
    }

    // Delete all recipes belonging to the user
    const {error: recipesError} = await supabaseAdmin
      .from('recipes')
      .delete()
      .eq('user_id', uid);

    if (recipesError) {
      console.error('Error deleting recipes:', recipesError);
      throw recipesError;
    }

    // Delete the user row from the users table
    const {error: userRowError} = await supabaseAdmin
      .from('users')
      .delete()
      .eq('user_id', uid);

    if (userRowError) {
      console.error('Error deleting user row:', userRowError);
      throw userRowError;
    }

    // Delete the auth user — tolerate "User not found" for idempotency
    const {error: deleteAuthError} = await supabaseAdmin.auth.admin.deleteUser(
      uid,
    );

    if (
      deleteAuthError &&
      !deleteAuthError.message.toLowerCase().includes('not found')
    ) {
      console.error('Error deleting auth user:', deleteAuthError);
      throw deleteAuthError;
    }

    return new Response(JSON.stringify({success: true}), {
      status: 200,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  } catch (err) {
    console.error('Unexpected error during account deletion:', err);
    return new Response(JSON.stringify({error: 'Failed to delete account'}), {
      status: 500,
      headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
    });
  }
});
