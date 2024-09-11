import { auth } from "@/auth"
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export const GET = auth(async function GET(request) {
  let session;
  try {
    session = request.auth;
  } catch (error) {
    console.error('Authentication failed:', error.message);
    return redirect('/');
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
    const { data, error } = await supabase
      .from("markers")
      .select("*")
      .eq('user_id', session.user.id);

    if (error) {
      throw new Error(error.message);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Failed to fetch markers:', error.message);
    return new Response(JSON.stringify({
      error: 'Failed to fetch markers',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
})


export const POST = auth(async function POST(request) {
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
    const requestData = await request.json();
    const { position, prev_marker, distance } = requestData;

    const { data, error } = await supabase
      .from('markers')
      .insert([{
        user_id: session.user.id,
        position: position,
        distance: distance,
        prev_marker: prev_marker
      }])
      .select()


    if (error) {
      throw new Error(error.message);
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Failed to insert marker:', error.message);
    return new Response(JSON.stringify({
      error: 'Failed to insert marker',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
})

export const DELETE = auth(async function DELETE(request) {
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
    const requestData = await request.json();
    const { id } = requestData;

    const { data, error } = await supabase
      .from('markers')
      .delete()
      .eq('id', id)
      .single()


    if (error) {
      throw new Error(error.message);
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Failed to insert marker:', error.message);
    return new Response(JSON.stringify({
      error: 'Failed to delete marker',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
})
