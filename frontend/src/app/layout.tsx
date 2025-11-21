import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/shared/contexts/AuthContext";
import { Header } from "@/shared/ui/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Otogram - Music SNS",
    description: "Share your favorite music",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    <Header />
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
