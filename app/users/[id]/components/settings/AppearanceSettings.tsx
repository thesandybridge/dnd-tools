'use client'

import { useTheme } from '@/app/providers/ThemeProvider'
import { GlassPanel } from '@/app/components/ui/GlassPanel'
import { Button } from '@/components/ui/button'
import ColorWheel from './ColorWheel'

const THEME_DEFAULTS: Record<string, { color: string; intensity: number }> = {
  parchment:  { color: '#c8a44e', intensity: 0.8 },
  shadowfell: { color: '#8b5cf6', intensity: 0.7 },
  dragonfire: { color: '#dc4a4a', intensity: 0.8 },
  feywild:    { color: '#4ade80', intensity: 0.6 },
}

const THEME_NAMES = ['parchment', 'shadowfell', 'dragonfire', 'feywild'] as const

const PARTICLE_OPTIONS = [
  { label: 'Auto', value: 'auto' },
  { label: 'Ember', value: 'ember' },
  { label: 'Wisp', value: 'wisp' },
  { label: 'Flame', value: 'flame' },
  { label: 'Sparkle', value: 'sparkle' },
  { label: 'Off', value: 'off' },
] as const

export default function AppearanceSettings() {
  const { theme, updateSettings, saveSettings, hasUnsavedChanges, isSaving } = useTheme()

  return (
    <div className="flex flex-col gap-6 w-full">
      <h2 className="font-cinzel text-lg font-semibold">Appearance</h2>

      {/* Theme Presets */}
      <GlassPanel variant="subtle" className="p-5">
        <h3 className="font-cinzel text-sm font-semibold mb-3 text-muted-foreground">Theme</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {THEME_NAMES.map((name) => {
            const defaults = THEME_DEFAULTS[name]
            const isActive = theme.themeName === name
            return (
              <button
                key={name}
                onClick={() =>
                  updateSettings({
                    themeName: name,
                    primaryColor: defaults.color,
                    particleEffect: 'auto',
                    coronaIntensity: defaults.intensity,
                  })
                }
                className="cursor-pointer"
              >
                <GlassPanel
                  variant="subtle"
                  corona={isActive}
                  coronaHover={!isActive}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                    isActive ? 'border-primary/30' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full border border-white/10"
                    style={{ backgroundColor: defaults.color }}
                  />
                  <span className="font-cinzel text-xs capitalize">{name}</span>
                </GlassPanel>
              </button>
            )
          })}
        </div>
      </GlassPanel>

      {/* Primary Color */}
      <GlassPanel variant="subtle" className="p-5">
        <h3 className="font-cinzel text-sm font-semibold mb-3 text-muted-foreground">Primary Color</h3>
        <div className="flex justify-center">
          <ColorWheel
            color={theme.primaryColor}
            onChange={(hex) => updateSettings({ primaryColor: hex })}
          />
        </div>
      </GlassPanel>

      {/* Particle Effect */}
      <GlassPanel variant="subtle" className="p-5">
        <h3 className="font-cinzel text-sm font-semibold mb-3 text-muted-foreground">Particle Effect</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {PARTICLE_OPTIONS.map((opt) => {
            const isActive = theme.particleEffect === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => updateSettings({ particleEffect: opt.value })}
                className="cursor-pointer"
              >
                <GlassPanel
                  variant="subtle"
                  corona={isActive}
                  coronaHover={!isActive}
                  className={`flex items-center justify-center p-2.5 rounded-lg transition-all text-xs ${
                    isActive ? 'border-primary/30' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  {opt.label}
                </GlassPanel>
              </button>
            )
          })}
        </div>
      </GlassPanel>

      {/* Corona Intensity + Dark/Light Mode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Corona Intensity */}
        <GlassPanel variant="subtle" className="p-5">
          <h3 className="font-cinzel text-sm font-semibold mb-3 text-muted-foreground">Corona Intensity</h3>
          <div className="flex flex-col gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={theme.coronaIntensity}
              onChange={(e) => updateSettings({ coronaIntensity: parseFloat(e.target.value) })}
              className="w-full accent-primary"
            />
            <span className="text-xs text-muted-foreground text-center tabular-nums">
              {theme.coronaIntensity.toFixed(1)}
            </span>
          </div>
        </GlassPanel>

        {/* Dark / Light Mode */}
        <GlassPanel variant="subtle" className="p-5">
          <h3 className="font-cinzel text-sm font-semibold mb-3 text-muted-foreground">Mode</h3>
          <div className="flex gap-2">
            <Button
              variant={theme.themeMode === 'dark' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => updateSettings({ themeMode: 'dark' })}
            >
              Dark
            </Button>
            <Button
              variant={theme.themeMode === 'light' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => updateSettings({ themeMode: 'light' })}
            >
              Light
            </Button>
          </div>
        </GlassPanel>
      </div>

      {/* Save Button */}
      <Button onClick={saveSettings} disabled={!hasUnsavedChanges || isSaving} className="self-end">
        {isSaving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  )
}
