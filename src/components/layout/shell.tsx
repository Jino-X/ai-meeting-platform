"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

interface ShellProps {
  children: React.ReactNode;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  organizations: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    role: string;
  }[];
  currentOrg: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  } | null;
}

export function Shell({ children, user, organizations, currentOrg }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar
          user={user}
          organizations={organizations}
          currentOrg={currentOrg}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          showMenuButton
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          workspaceSlug={currentOrg?.slug}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
