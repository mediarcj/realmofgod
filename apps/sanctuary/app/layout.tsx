// File: apps/sanctuary/app/layout.tsx
// Description: Defines the root document frame for the Sanctuary V2 application.
// Purpose: Provides shared metadata and global styles before physical sanctuary objects are introduced.
// Notes: This server component deliberately contains no browser-only 3D code.

import type { Metadata } from "next";
import "./styles.css";

// Keep the initial page title truthful while the visual sanctuary is constructed in small steps.
export const metadata: Metadata = {
  title: "Realm of God — Sanctuary V2",
  description: "An anonymous interactive Christian digital sanctuary.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The language declaration and shared body styling serve every future route.
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
