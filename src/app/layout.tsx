import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import CartIcon from "@/components/CartIcon";
import GlobalIncomingCallHandler from "@/components/GlobalIncomingCallHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MediConnect - Advanced Telemedicine Platform",
  description:
    "Connect with expert doctors, get prescriptions, order medicines, and book lab tests - all from the comfort of your home.",
  keywords:
    "telemedicine, healthcare, doctors, online consultation, medical services",
  authors: [{ name: "MediConnect Team" }],
  creator: "MediConnect",
  publisher: "MediConnect",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mediconnect.example.com",
    title: "MediConnect - Advanced Telemedicine Platform",
    description:
      "Connect with expert doctors, get prescriptions, order medicines, and book lab tests - all from the comfort of your home.",
    siteName: "MediConnect",
  },
  twitter: {
    card: "summary_large_image",
    title: "MediConnect - Advanced Telemedicine Platform",
    description:
      "Connect with expert doctors, get prescriptions, order medicines, and book lab tests - all from the comfort of your home.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Suppress hydration warning for body element due to browser extensions 
          that may add attributes like cz-shortcut-listen, data-new-gr-c-s-check-loaded, etc. */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        suppressHydrationWarning={true}
      >
        <CartProvider>
          <ToastProvider>
            <CartIcon />
            <GlobalIncomingCallHandler />
            {children}
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
