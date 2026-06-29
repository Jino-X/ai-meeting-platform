import { Metadata } from "next";
import Link from "next/link";
import {
  Video,
  CheckSquare,
  Users,
  TrendingUp,
  Clock,
  Calendar,
  ArrowRight,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/lib/auth-helpers";
import { formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Dashboard | AI Meeting Intelligence",
  description: "Your workspace dashboard",
};

interface DashboardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params;

  const organization = await prisma.organization.findUnique({
    where: { slug },
  });

  if (!organization) {
    return null;
  }

  await requireOrganizationAccess(organization.id);

  // Fetch dashboard stats
  const [meetingsCount, tasksCount, membersCount, recentMeetings, pendingTasks] =
    await Promise.all([
      prisma.meeting.count({
        where: { organizationId: organization.id },
      }),
      prisma.task.count({
        where: { organizationId: organization.id },
      }),
      prisma.membership.count({
        where: { organizationId: organization.id, status: "ACTIVE" },
      }),
      prisma.meeting.findMany({
        where: { organizationId: organization.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          scheduledAt: true,
          createdAt: true,
        },
      }),
      prisma.task.findMany({
        where: {
          organizationId: organization.id,
          status: { in: ["TODO", "IN_PROGRESS"] },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
        include: {
          assignee: {
            select: { name: true, email: true },
          },
        },
      }),
    ]);

  const stats = [
    {
      title: "Total Meetings",
      value: meetingsCount,
      icon: Video,
      href: `/workspaces/${slug}/meetings`,
    },
    {
      title: "Active Tasks",
      value: tasksCount,
      icon: CheckSquare,
      href: `/workspaces/${slug}/tasks`,
    },
    {
      title: "Team Members",
      value: membersCount,
      icon: Users,
      href: `/workspaces/${slug}/team`,
    },
    {
      title: "AI Minutes Saved",
      value: "0h",
      icon: TrendingUp,
      href: `/workspaces/${slug}/analytics`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening in your workspace.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="transition-colors hover:bg-accent">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Meetings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Meetings</CardTitle>
              <CardDescription>Your latest meeting recordings</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/workspaces/${slug}/meetings`}>
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentMeetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Video className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No meetings yet
                </p>
                <Button className="mt-4" asChild>
                  <Link href={`/workspaces/${slug}/meetings/new`}>
                    Schedule Meeting
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentMeetings.map((meeting) => (
                  <Link
                    key={meeting.id}
                    href={`/workspaces/${slug}/meetings/${meeting.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Video className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{meeting.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {meeting.scheduledAt
                            ? formatDate(meeting.scheduledAt)
                            : formatDate(meeting.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        meeting.status === "COMPLETED" ? "success" : "secondary"
                      }
                    >
                      {meeting.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Tasks</CardTitle>
              <CardDescription>Tasks that need your attention</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/workspaces/${slug}/tasks`}>
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckSquare className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No pending tasks
                </p>
                <Button className="mt-4" asChild>
                  <Link href={`/workspaces/${slug}/tasks/new`}>
                    Create Task
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/workspaces/${slug}/tasks/${task.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <CheckSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.assignee?.name || "Unassigned"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.dueDate && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                      <Badge
                        variant={
                          task.priority === "HIGH" || task.priority === "CRITICAL"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
