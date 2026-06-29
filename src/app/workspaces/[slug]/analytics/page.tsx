import { Metadata } from "next";
import {
  BarChart3,
  Video,
  CheckSquare,
  Clock,
  Users,
  TrendingUp,
  Sparkles,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/lib/auth-helpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = {
  title: "Analytics | AI Meeting Intelligence",
  description: "View your workspace analytics",
};

interface AnalyticsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { slug } = await params;

  const organization = await prisma.organization.findUnique({
    where: { slug },
    include: {
      subscriptions: true,
    },
  });

  if (!organization) {
    return null;
  }

  await requireOrganizationAccess(organization.id);

  const [
    totalMeetings,
    completedMeetings,
    totalTasks,
    completedTasks,
    totalMembers,
    recentMeetings,
  ] = await Promise.all([
    prisma.meeting.count({ where: { organizationId: organization.id } }),
    prisma.meeting.count({
      where: { organizationId: organization.id, status: "COMPLETED" },
    }),
    prisma.task.count({ where: { organizationId: organization.id } }),
    prisma.task.count({
      where: { organizationId: organization.id, status: "DONE" },
    }),
    prisma.membership.count({
      where: { organizationId: organization.id, status: "ACTIVE" },
    }),
    prisma.meeting.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
      take: 7,
      select: {
        id: true,
        title: true,
        createdAt: true,
        duration: true,
      },
    }),
  ]);

  const taskCompletionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalDuration = recentMeetings.reduce(
    (acc, m) => acc + (m.duration || 0),
    0
  );

  const subscription = organization.subscriptions[0];
  const aiUsage = subscription?.usageAiMinutes || 0;
  const aiLimit =
    organization.plan === "FREE"
      ? 60
      : organization.plan === "PRO"
        ? 600
        : 6000;

  const stats = [
    {
      title: "Total Meetings",
      value: totalMeetings,
      icon: Video,
      description: `${completedMeetings} completed`,
      color: "text-blue-600",
    },
    {
      title: "Total Tasks",
      value: totalTasks,
      icon: CheckSquare,
      description: `${taskCompletionRate}% completion rate`,
      color: "text-green-600",
    },
    {
      title: "Team Members",
      value: totalMembers,
      icon: Users,
      description: "Active members",
      color: "text-purple-600",
    },
    {
      title: "Meeting Time",
      value: `${Math.round(totalDuration / 60)}h`,
      icon: Clock,
      description: "Last 7 meetings",
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track your workspace performance and usage
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Task Completion
            </CardTitle>
            <CardDescription>
              Overall task completion rate for your workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {completedTasks} of {totalTasks} tasks completed
              </span>
              <span className="text-2xl font-bold">{taskCompletionRate}%</span>
            </div>
            <Progress value={taskCompletionRate} className="h-3" />
            <div className="grid grid-cols-4 gap-2 pt-4">
              {["TODO", "IN_PROGRESS", "REVIEW", "DONE"].map((status) => (
                <div key={status} className="text-center">
                  <div className="text-lg font-semibold">
                    {status === "DONE" ? completedTasks : "-"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {status.replace("_", " ")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Usage
            </CardTitle>
            <CardDescription>
              AI processing minutes used this billing period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {aiUsage} of {aiLimit} minutes used
              </span>
              <span className="text-2xl font-bold">
                {Math.round((aiUsage / aiLimit) * 100)}%
              </span>
            </div>
            <Progress
              value={Math.min((aiUsage / aiLimit) * 100, 100)}
              className="h-3"
            />
            <div className="flex items-center justify-between pt-4">
              <div>
                <div className="text-sm font-medium">Current Plan</div>
                <div className="text-xs text-muted-foreground">
                  {organization.plan}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">Remaining</div>
                <div className="text-xs text-muted-foreground">
                  {Math.max(aiLimit - aiUsage, 0)} minutes
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Meetings
          </CardTitle>
          <CardDescription>
            Your last 7 meetings and their duration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentMeetings.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No meetings yet
            </p>
          ) : (
            <div className="space-y-4">
              {recentMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{meeting.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(meeting.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {meeting.duration || 0} min
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
