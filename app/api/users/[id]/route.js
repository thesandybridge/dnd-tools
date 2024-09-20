import { auth } from "@/auth"
import { createClient } from '@supabase/supabase-js'

export const GET = auth(async function PATCH(request, { params }) {
  let session;
  try {
    session = request.auth;
  } catch (error) {
    console.error('Authentication failed:', error.message);
    return new Response(JSON.stringify({
      error: 'Authentication failed',
      details: error.message
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${session.supabaseAccessToken}`,
        },
      },
    }
  );

  try {
    const { id } = params

    const { data, error } = await supabase
      .from('users')
      .select("*")
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Failed to fetch user data:', error.message);
    return new Response(JSON.stringify({
      error: 'Failed to fetch user data',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
})

export const PATCH = auth(async function PATCH(request, { params }) {
  let session;
  try {
    session = request.auth;
  } catch (error) {
    console.error('Authentication failed:', error.message);
    return new Response(JSON.stringify({
      error: 'Authentication failed',
      details: error.message
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${session.supabaseAccessToken}`,
        },
      },
    }
  );

  try {
    const { id } = params
    const requestData = await request.json()
    const { userData } = requestData

    const { data, error } = await supabase
      .from('users')
      .update({
        color: userData.color
      })
      .eq('id', id)
      .select()

    if (error) {
      throw new Error(error.message)
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Failed to update user color:', error.message);
    return new Response(JSON.stringify({
      error: 'Failed to update user color',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
})
