import { auth } from "@/auth"
import { createClient } from '@supabase/supabase-js'

export const GET = auth(async function PATCH(request) {
  let session
  try {
    session = request.auth
  } catch (error) {
    console.error('Authentication failed:', error.message)
    return new Response(JSON.stringify({
      error: 'Authentication failed',
      details: error.message
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
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
  )

  try {
    const { data, error } = await supabase
      .from('users')
      .select("*")

    if (error) {
      throw new Error(error.message)
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Failed to fetch users:', error.message)
    return new Response(JSON.stringify({
      error: 'Failed to fetch users',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
})
