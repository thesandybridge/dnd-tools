import { Inter, Cinzel } from "next/font/google"
import Nav from "@/app/components/navigation/Nav"
import { SpeedDial } from "@/app/components/navigation/SpeedDial"
import { SessionProvider } from 'next-auth/react'
import "@/app/globals.css"
import 'leaflet/dist/leaflet.css'
import ThemeProvider from "@/app/providers/ThemeProvider"
import { GrainOverlay } from "@/app/components/effects/GrainOverlay"
import { AmbientParticles } from "@/app/components/effects/AmbientParticles"
import { CursorGlow } from "@/app/components/effects/CursorGlow"
import QueryClientProvider from "@/app/providers/QueryClientProvider"
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'


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
          <QueryClientProvider>
              <ThemeProvider>
                <Nav />
                <div className="flex min-h-dvh">
                  <div className="hidden md:block w-16 shrink-0" />
                  <main className="flex-1 pb-16 md:pb-0">
                    {children}
                  </main>
                </div>
                <SpeedDial />
                <footer className="md:ml-16 flex justify-center p-2 text-sm text-muted-foreground">
                  <p>&copy; {year} - made with ♥ by sandybridge</p>
                </footer>
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
