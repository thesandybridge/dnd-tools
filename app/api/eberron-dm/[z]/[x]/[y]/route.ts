export async function GET(_: Request, { params }: { params: Promise<{ z: string; x: string; y: string }> }) {
  const { z, x, y } = await params

  try {
    const res = await fetch(`${process.env.STORAGE_URL}/eberron-dm/${z}/${x}/${y}`)

    if (!res.ok) {
      return new Response(null, { status: res.status })
    }

    return new Response(res.body, {
      headers: { 'Content-Type': 'image/png' },
    })
  } catch (error) {
    console.error('Error fetching tile:', error)
    return Response.json({
      error: 'Failed to fetch tile',
      details: (error as Error).message,
    }, { status: 500 })
  }
}
