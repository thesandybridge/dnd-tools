import { auth } from "@/auth"
import { createClient } from '@supabase/supabase-js'

const createSupabaseClient = (session) => {
  return createClient(
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
}

export const GET = auth(async function GET(request, { params }) {
  let session
  try {
    session = request.auth
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Authentication failed',
      details: error.message
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  const supabase = createSupabaseClient(session)

  try {
    const { guild_id, member_id } = await params

    const { data, error } = await supabase
      .from('guild_members')
      .select('user_id, role, joined_at')
      .eq('guild_id', guild_id)
      .eq('user_id', member_id)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch member data',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

export const PATCH = auth(async function PATCH(request, { params }) {
  let session
  try {
    session = request.auth
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Authentication failed',
      details: error.message
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  const supabase = createSupabaseClient(session)

  try {
    const { guild_id, member_id } = await params
    const requestData = await request.json()
    const { role } = requestData

    const { data: currentUser, error: currentUserError } = await supabase
      .from('guild_members')
      .select('role')
      .eq('guild_id', guild_id)
      .eq('user_id', session.user.id)
      .single()

    if (currentUserError || !['owner', 'admin'].includes(currentUser.role)) {
      return new Response(JSON.stringify({
        error: 'You are not authorized to update this member'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { data, error } = await supabase
      .from('guild_members')
      .update({ role })
      .eq('guild_id', guild_id)
      .eq('user_id', member_id)

    if (error) {
      throw new Error(error.message)
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to update member role',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
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
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (!session?.user) {
    console.log('No session user found')
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  const supabase = createSupabaseClient(session)

  try {
    const { guild_id, member_id } = await params

    const { data: memberData, error: memberError } = await supabase
      .from('guild_members')
      .select('role')
      .eq('guild_id', guild_id)
      .eq('user_id', member_id)
      .single()

    if (memberError) {
      throw new Error(`Failed to fetch member data: ${memberError.message}`)
    }

    if (memberData.role === 'owner') {
      const { error: guildDeleteError } = await supabase
        .from('guilds')
        .delete()
        .eq('guild_id', guild_id)

      if (guildDeleteError) {
        throw new Error(`Failed to delete guild: ${guildDeleteError.message}`)
      }

      const { error: membersDeleteError } = await supabase
        .from('guild_members')
        .delete()
        .eq('guild_id', guild_id)

      if (membersDeleteError) {
        throw new Error(`Failed to delete guild members: ${membersDeleteError.message}`)
      }

      return new Response(JSON.stringify({ redirect: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { data, error } = await supabase
      .from('guild_members')
      .delete()
      .eq('guild_id', guild_id)
      .eq('user_id', member_id)

    if (error) {
      throw new Error(error.message)
    }

    return new Response(JSON.stringify({...data, redirect: false}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Failed to remove member or delete guild:', error.message)
    return new Response(JSON.stringify({
      error: 'Failed to remove member or delete guild',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
