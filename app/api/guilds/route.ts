import { auth } from "@/auth"
import { createClient } from '@supabase/supabase-js'

export const GET = auth(async function PATCH(request: Request) {
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
      .from('guilds')
      .select(`
        id,
        name,
        owner ( name, id ),
        guild_id
      `)

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
    console.error('Failed to fetch guilds:', error.message)
    return new Response(JSON.stringify({
      error: 'Failed to fetch guilds',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
})

export const POST = auth(async function POST(request) {
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
    const requestData = await request.json()
    const { guildData } = requestData

    const { data: newGuildData, error: guildError } = await supabase
      .from('guilds')
      .insert({
        name: guildData.name,
        owner: guildData.owner
      })
      .select()
      .single()

    if (guildError) {
      throw new Error(guildError.message)
    }

    const { data: memberData, error: memberError } = await supabase
      .from('guild_members')
      .insert({
        guild_id: newGuildData.guild_id,
        user_id: newGuildData.owner,
        role: 'owner'
      })

    if (memberError) {
      throw new Error(memberError.message)
    }

    return new Response(JSON.stringify(newGuildData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Failed to add guild:', error.message)
    return new Response(JSON.stringify({
      error: 'Failed to add guild',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
})
