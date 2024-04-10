import { Inter } from "next/font/google";
import Nav from "./components/navigation/Nav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Dicks and Dragons",
  description: "Our Dungeons and Dragons Campaign",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Nav />
                {children}
            </body>
        </html>
    );
}
