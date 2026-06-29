import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Building2 } from "lucide-react";

import { requireAuth, getUserOrganizations } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Workspaces | AI Meeting Intelligence",
  description: "Select or create a workspace",
};

export default async function WorkspacesPage() {
  const user = await requireAuth();
  const organizations = await getUserOrganizations(user.id);

  // If user has only one org, redirect to it
  if (organizations.length === 1) {
    redirect(`/workspaces/${organizations[0].slug}/dashboard`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Select a Workspace</h1>
          <p className="text-muted-foreground">
            Choose a workspace to continue or create a new one
          </p>
        </div>

        {organizations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">No workspaces yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create your first workspace to get started
                </p>
              </div>
              <Button asChild>
                <Link href="/workspaces/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workspace
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4">
              {organizations.map((org) => (
                <Link key={org.id} href={`/workspaces/${org.slug}/dashboard`}>
                  <Card className="cursor-pointer transition-colors hover:bg-accent">
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        {org.logoUrl ? (
                          <img
                            src={org.logoUrl}
                            alt={org.name}
                            className="h-full w-full rounded-lg object-cover"
                          />
                        ) : (
                          <Building2 className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{org.name}</CardTitle>
                        <CardDescription>/{org.slug}</CardDescription>
                      </div>
                      <Badge variant="secondary">{org.role}</Badge>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Button variant="outline" asChild>
                <Link href="/workspaces/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Workspace
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
