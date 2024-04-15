import { auth } from "@/auth"
import { createClient } from '@supabase/supabase-js'

export const DELETE = auth(async function DELETE(request, {params}) {
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

        const { data: marker, error: fetchError } = await supabase
            .from('markers')
            .select('prev_marker')
            .eq('id', id)
            .single();

        if (fetchError || !marker) {
            throw new Error(fetchError.message);
        }

        const { error: updateError } = await supabase
            .from('markers')
            .update({ prev_marker: marker.prev_marker })
            .eq('prev_marker', id);

        if (updateError) {
            throw new Error(updateError.message);
        }

        const { error: deleteError } = await supabase
            .from('markers')
            .delete()
            .eq('id', id);

        if (deleteError) {
            throw new Error(deleteError.message);
        }

        return new Response(JSON.stringify({ message: "Marker deleted successfully" }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Failed to delete marker:', error.message);
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
