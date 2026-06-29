import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAuth } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { CreateWorkspaceForm } from "./create-workspace-form";

export const metadata: Metadata = {
  title: "Create Workspace | AI Meeting Intelligence",
  description: "Create a new workspace",
};

export default async function NewWorkspacePage() {
  await requireAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/workspaces">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to workspaces
          </Link>
        </Button>

        <div className="text-center">
          <h1 className="text-2xl font-bold">Create a Workspace</h1>
          <p className="text-muted-foreground">
            Set up a new workspace for your team
          </p>
        </div>

        <CreateWorkspaceForm />
      </div>
    </div>
  );
}
