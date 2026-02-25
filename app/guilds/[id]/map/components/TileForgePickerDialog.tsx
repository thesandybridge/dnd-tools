'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, ImageOff } from 'lucide-react'
import { useDebounce } from '@/app/hooks/useDebounce'
import { fetchTileForgeTilesets, getTileForgeThumbnailUrl, TILEFORGE_URLS, TILEFORGE_COPY, type TileForgeTileset } from '@/lib/tileforge'
import { GlassPanel } from '@/app/components/ui/GlassPanel'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (tileset: TileForgeTileset) => void
}

export default function TileForgePickerDialog({ open, onOpenChange, onSelect }: Props) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data: tilesets, isLoading, isError, error } = useQuery({
    queryKey: ['tileforge-tilesets', debouncedSearch],
    queryFn: () => fetchTileForgeTilesets(debouncedSearch || undefined),
    enabled: open,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="max-w-2xl max-h-[80vh] flex flex-col"
      >
        <DialogHeader>
          <DialogTitle className="font-cinzel">Import from TileForge</DialogTitle>
          <a
            href={TILEFORGE_URLS.home}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors w-fit"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            {TILEFORGE_COPY.poweredBy}
          </a>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tilesets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md text-sm bg-white/[0.05] border border-white/[0.08] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-destructive">{(error as Error).message}</p>
            </div>
          )}

          {!isLoading && !isError && tilesets?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <ImageOff className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No tilesets found</p>
              <a
                href={TILEFORGE_URLS.home}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Create tilesets on TileForge
              </a>
            </div>
          )}

          {!isLoading && !isError && tilesets && tilesets.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {tilesets.map((tileset) => (
                <button
                  key={tileset.id}
                  type="button"
                  className="text-left cursor-pointer transition-all hover:scale-[1.02]"
                  onClick={() => {
                    onSelect(tileset)
                    onOpenChange(false)
                  }}
                >
                  <GlassPanel coronaHover className="p-2 h-full">
                    <TilesetThumbnail tileset={tileset} />
                    <p className="font-cinzel text-sm font-medium truncate mt-2">
                      {tileset.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tileset.width && tileset.height
                        ? `${tileset.width}x${tileset.height}`
                        : 'Unknown size'}
                      {' · '}
                      z{tileset.min_zoom}-{tileset.max_zoom}
                    </p>
                  </GlassPanel>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TilesetThumbnail({ tileset }: { tileset: TileForgeTileset }) {
  const [broken, setBroken] = useState(false)

  return (
    <div className="aspect-square w-full rounded-lg overflow-hidden bg-white/[0.05]">
      {!broken && (
        <img
          src={getTileForgeThumbnailUrl(tileset.storage_path)}
          alt={tileset.name}
          className="w-full h-full object-cover"
          onError={() => setBroken(true)}
        />
      )}
      {broken && (
        <div className="w-full h-full flex items-center justify-center">
          <ImageOff className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
