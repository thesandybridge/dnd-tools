import { Inter, Cinzel } from "next/font/google"
import Nav from "@/app/components/navigation/Nav"
import { SessionProvider } from 'next-auth/react'
import "@/app/globals.css"
import 'leaflet/dist/leaflet.css'
import "@fortawesome/fontawesome-svg-core/styles.css"
import { config } from "@fortawesome/fontawesome-svg-core"
import ThemeProvider from "@/app/providers/ThemeProvider"
import QueryClientProvider from "@/app/providers/QueryClientProvider"
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'


config.autoAddCss = false

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", weight: ["400", "700"] })

export const metadata = {
  title: "Dungeon Syndrome",
  description: "Our Dungeons and Dragons Campaign",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear()
  return (
    <html lang="en">
      <body className={`${inter.variable} ${cinzel.variable} ${inter.className}`}>
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
                <footer className="md:ml-16 flex justify-center p-2 text-sm text-muted-foreground">
                  <p>&copy; {year} - made with ♥ by sandybridge</p>
                </footer>
              </ThemeProvider>
            <ReactQueryDevtools
              initialIsOpen={false}
              buttonPosition="bottom-left"
            />
          </QueryClientProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
