import type { Metadata } from "next";
import localFont from "next/font/local";
import "./styles/globals.css";
import { cn } from "@repo/shadverse/lib/utils";
import { RootProvider } from "fumadocs-ui/provider";
import { description } from "./layout.config";
import { baseUrl, createMetadata } from "@/lib/metadata";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata = createMetadata({
  title: {
    template: "%s | yourdomain.com",
    default: "yourdomain.com",
  },
  description: description,
  metadataBase: baseUrl,
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          crossOrigin="anonymous"
          src="//cdn.jsdelivr.net/npm/meta-scan@0.15.0/dist/auto.global.js"
          data-auto-enable={"false"}
        />
      </head>
      <body
        className={cn("relative flex min-h-svh flex-col overflow-x-hidden")}
      >
        <RootProvider
          search={{
            options: {
              type: "static",
            },
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
