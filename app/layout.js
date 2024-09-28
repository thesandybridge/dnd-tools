import { Inter } from "next/font/google"
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

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Dungeon Syndrome",
  description: "Our Dungeons and Dragons Campaign",
}

export default function RootLayout({ children }) {
  const year = new Date().getFullYear()
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <QueryClientProvider>
            <ThemeProvider>
              <Nav />
              {children}
              <footer>
                <p>© {year} - made with ♥ by sandybridge</p>
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
