"use client";

import { AppProvider } from "@/contexts/AppContext";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DataLoader } from "@/components/loaders/DataLoader";

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <DataLoader>
        <div className="flex min-h-screen flex-col bg-background">
          <main className="flex-1 pb-16 pt-2">
            <div className="container max-w-screen-xl mx-auto px-4">
              {children}
            </div>
          </main>
          <BottomNav />
        </div>
      </DataLoader>
    </AppProvider>
  );
}
