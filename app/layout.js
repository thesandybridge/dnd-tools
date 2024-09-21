import { Inter } from "next/font/google";
import Nav from "./components/navigation/Nav";
import { SessionProvider } from 'next-auth/react'
import "./globals.css";
import 'leaflet/dist/leaflet.css';
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import ThemeProvider from "./providers/ThemeProvider";
import QueryClientProvider from "./providers/QueryClientProvider";
config.autoAddCss = false;

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Dungeon Syndrome",
  description: "Our Dungeons and Dragons Campaign",
};

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
          </QueryClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
