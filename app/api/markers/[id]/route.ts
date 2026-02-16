import { auth } from "@/auth"
import { createClient } from '@supabase/supabase-js'

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
    const { id } = await params

    const { data: referencingMarkers, error: referencingError } = await supabase
      .from('markers')
      .select('uuid')
      .eq('prev_marker', id)

    if (referencingError) {
      throw new Error(referencingError.message)
    }

    // Retrieve current marker's prev_marker
    const { data: marker, error: fetchError } = await supabase
      .from('markers')
      .select('prev_marker')
      .eq('uuid', id)
      .single()

    if (fetchError || !marker) {
      throw new Error(fetchError ? fetchError.message : "Marker not found")
    }

    // Update any markers that pointed to the deleted marker to point to its prev_marker
    if (referencingMarkers.length > 0) {
      const { error: updateError } = await supabase
        .from('markers')
        .update({ prev_marker: marker.prev_marker })
        .eq('prev_marker', id)

      if (updateError) {
        throw new Error(updateError.message)
      }
    }

    // Proceed to delete the marker
    const { error: deleteError } = await supabase
      .from('markers')
      .delete()
      .eq('uuid', id)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    return new Response(JSON.stringify({ message: "Marker deleted successfully" }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Failed to delete marker:', error.message)
    return new Response(JSON.stringify({
      error: 'Failed to delete marker',
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
    const { id } = await params
    const requestData = await request.json()
    const { distance } = requestData

    const { data, error } = await supabase
      .from('markers')
      .update({ distance })
      .eq('id', id)

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
    console.error('Failed to update marker:', error.message)
    return new Response(JSON.stringify({
      error: 'Failed to update marker',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
})
