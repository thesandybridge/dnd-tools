import { auth } from "@/auth"
import { createClient } from '@supabase/supabase-js'
import { type NextRequest } from "next/server"

export const GET = auth(async function PATCH(request: NextRequest, { params }) {
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
    const { guild_id } = await params

    const { data, error } = await supabase
      .from('guilds')
      .select('id, name, owner ( name ), guild_id')
      .eq('guild_id', guild_id)
      .single()

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
    console.error('Failed to fetch user data:', error.message)
    return new Response(JSON.stringify({
      error: 'Failed to fetch user data',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
})

export const PATCH = auth(async function PATCH(request, { params }) {
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
    const { guild_id } = await params
    const requestData = await request.json()
    const { guildData } = requestData

    const { data, error } = await supabase
      .from('guilds')
      .update({ ...guildData })
      .eq('guild_id', guild_id)
      .select()

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
    console.error('Failed to update user color:', error.message)
    return new Response(JSON.stringify({
      error: 'Failed to update user color',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
})

export const DELETE = auth(async function DELETE(request, { params }) {
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
    const { guild_id } = await params

    const { data, error } = await supabase
      .from('guilds')
      .delete()
      .eq('guild_id', guild_id)

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
    console.error('Failed to update user color:', error.message)
    return new Response(JSON.stringify({
      error: 'Failed to update user color',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
})
