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
    const { guild_id } = params

    const { data, error } = await supabase
      .from('guild_members')
      .select(`
        guild_id,
        user_id,
        role,
        users ( id, name, email )
      `)
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
    console.error('Failed to fetch members:', error.message)
    return new Response(JSON.stringify({
      error: 'Failed to fetch members',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
})

export const POST = auth(async function POST(request, { params }) {
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
    const { guild_id } = params
    const { memberId, role } = await request.json()

    const { data: currentUser, error: userError } = await supabase
      .from('guild_members')
      .select('role')
      .eq('guild_id', guild_id)
      .eq('user_id', session.user.id)
      .single()

    if (userError || (currentUser.role !== 'owner' && currentUser.role !== 'admin')) {
      return new Response(JSON.stringify({
        error: 'Unauthorized to add members'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { data, error } = await supabase
      .from('guild_members')
      .insert({
        guild_id,
        user_id: memberId,
        role: role || 'member'
      })

    if (error) {
      throw new Error(error.message)
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Failed to add member:', error.message)
    return new Response(JSON.stringify({
      error: 'Failed to add member',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
