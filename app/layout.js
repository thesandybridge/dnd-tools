import { Inter } from "next/font/google";
import Nav from "./components/navigation/Nav";
import "./globals.css";
import 'leaflet/dist/leaflet.css';


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Dicks and Dragons",
  description: "Our Dungeons and Dragons Campaign",
};

export default function RootLayout({ children }) {
    const year = new Date().getFullYear()
    return (
        <html lang="en">
            <body className={inter.className}>
                <Nav />
                {children}
                <footer>
                    <p>© {year} - made with ♥ by sandybridge</p>
                </footer>
            </body>

        </html>
    );
}
