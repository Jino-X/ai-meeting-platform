import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { Mail, Calendar, Building2, Shield } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function ProfilePage() {
  const user = await requireAuth();

  const userWithDetails = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      memberships: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
            },
          },
        },
        where: {
          status: "ACTIVE",
        },
        orderBy: {
          joinedAt: "desc",
        },
      },
      _count: {
        select: {
          createdTasks: true,
          assignedTasks: true,
          actionItems: true,
        },
      },
    },
  });

  if (!userWithDetails) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground">
              Manage your personal information and preferences
            </p>
          </div>
          <Button asChild>
            <Link href="/profile/settings">Edit Profile</Link>
          </Button>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={userWithDetails.image || undefined} />
                <AvatarFallback className="text-2xl">
                  {getInitials(userWithDetails.name || userWithDetails.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{userWithDetails.name || "No name set"}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4" />
                  {userWithDetails.email}
                </CardDescription>
                {userWithDetails.emailVerified && (
                  <Badge variant="secondary" className="mt-2">
                    Email Verified
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(userWithDetails.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Workspaces</p>
                  <p className="text-sm text-muted-foreground">
                    {userWithDetails.memberships.length} workspace{userWithDetails.memberships.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>Your contribution across all workspaces</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold">{userWithDetails._count.createdTasks}</p>
                <p className="text-sm text-muted-foreground">Tasks Created</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold">{userWithDetails._count.assignedTasks}</p>
                <p className="text-sm text-muted-foreground">Tasks Assigned</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold">{userWithDetails._count.actionItems}</p>
                <p className="text-sm text-muted-foreground">Action Items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workspaces */}
        <Card>
          <CardHeader>
            <CardTitle>Your Workspaces</CardTitle>
            <CardDescription>Organizations you're a member of</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userWithDetails.memberships.length > 0 ? (
                userWithDetails.memberships.map((membership) => (
                  <Link
                    key={membership.id}
                    href={`/workspaces/${membership.organization.slug}/dashboard`}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        {membership.organization.logoUrl ? (
                          <img
                            src={membership.organization.logoUrl}
                            alt={membership.organization.name}
                            className="h-full w-full rounded-lg object-cover"
                          />
                        ) : (
                          <Building2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{membership.organization.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Joined {formatDate(membership.joinedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {membership.role}
                      </Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No workspaces</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You're not a member of any workspace yet
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/workspaces/new">Create Workspace</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
