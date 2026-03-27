import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Fika POS",
  description: "Sistema de punto de venta — Fika Cafetería",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full overflow-hidden">
      <body className="h-full overflow-hidden bg-fika-beige text-fika-black antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}