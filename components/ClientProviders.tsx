"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          developerNotice: 'hidden'
        },
        layout: {
          unsafe_disableDevelopmentModeWarnings: true
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
}
