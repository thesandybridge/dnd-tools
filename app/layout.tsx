import { Inter, Cinzel } from "next/font/google"
import Nav from "@/app/components/navigation/Nav"
import { SpeedDial } from "@/app/components/navigation/SpeedDial"
import { WidgetProvider } from "@/app/components/widgets/WidgetProvider"
import { WidgetArea } from "@/app/components/widgets/WidgetArea"
import { SessionProvider } from 'next-auth/react'
import "@/app/globals.css"
import 'leaflet/dist/leaflet.css'
import ThemeProvider from "@/app/providers/ThemeProvider"
import { GrainOverlay } from "@/app/components/effects/GrainOverlay"
import { AmbientParticles } from "@/app/components/effects/AmbientParticles"
import { CursorGlow } from "@/app/components/effects/CursorGlow"
import { TimezoneSync } from "@/app/components/TimezoneSync"
import QueryClientProvider from "@/app/providers/QueryClientProvider"
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TILEFORGE_URLS, TILEFORGE_COPY } from "@/lib/tileforge"


const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", weight: ["400", "700"], preload: false })

export const metadata = {
  title: "Dungeon Syndrome",
  description: "Our Dungeons and Dragons Campaign",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear()
  return (
    <html lang="en" data-theme="parchment" data-mode="dark">
      <body className={`${inter.variable} ${cinzel.variable} ${inter.className}`}>
        <svg width="0" height="0" aria-hidden="true" className="absolute">
          <filter id="corona-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.04 0.06" numOctaves={4} seed="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={6} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <GrainOverlay />
        <AmbientParticles />
        <CursorGlow />
        <SessionProvider>
          <TimezoneSync />
          <QueryClientProvider>
              <ThemeProvider>
                <WidgetProvider>
                  <Nav />
                  <div className="flex flex-col min-h-dvh overflow-x-hidden">
                    <div className="flex flex-1">
                      <div className="hidden md:block w-16 shrink-0" />
                      <main className="flex-1 min-w-0 pb-16 md:pb-0">
                        {children}
                      </main>
                    </div>
                    <footer className="md:ml-16 border-t border-white/[0.06] py-6 px-4">
                      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
                        <p>&copy; {year} Dungeon Syndrome</p>
                        <div className="flex items-center gap-4">
                          <a href="https://sandybridge.io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                            Portfolio
                          </a>
                          <span className="text-white/10">|</span>
                          <a href="https://github.com/thesandybridge/dnd-tools" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                            GitHub
                          </a>
                          <span className="text-white/10">|</span>
                          <a
                            href={TILEFORGE_URLS.home}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/30 transition-all text-xs font-medium"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                            {TILEFORGE_COPY.poweredBy}
                          </a>
                        </div>
                      </div>
                    </footer>
                  </div>
                  <WidgetArea />
                  <SpeedDial />
                </WidgetProvider>
              </ThemeProvider>
            <ReactQueryDevtools
              initialIsOpen={false}
              buttonPosition="top-right"
            />
          </QueryClientProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
