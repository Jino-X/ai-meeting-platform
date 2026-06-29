import { Metadata } from "next";
import Link from "next/link";
import { Plus, CheckSquare, Calendar, User, Clock } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/lib/auth-helpers";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TaskBoard } from "./task-board";

export const metadata: Metadata = {
  title: "Tasks | AI Meeting Intelligence",
  description: "Manage your tasks",
};

interface TasksPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string }>;
}

export default async function TasksPage({ params, searchParams }: TasksPageProps) {
  const { slug } = await params;
  const { view = "board" } = await searchParams;

  const organization = await prisma.organization.findUnique({
    where: { slug },
  });

  if (!organization) {
    return null;
  }

  await requireOrganizationAccess(organization.id);

  const tasks = await prisma.task.findMany({
    where: { organizationId: organization.id },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      assignee: {
        select: { id: true, name: true, email: true, image: true },
      },
      meeting: {
        select: { id: true, title: true },
      },
    },
  });

  const members = await prisma.membership.findMany({
    where: { organizationId: organization.id, status: "ACTIVE" },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track your team&apos;s tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-1">
            <Link
              href={`/workspaces/${slug}/tasks?view=board`}
              className={`rounded-md px-3 py-1 text-sm ${
                view === "board"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              Board
            </Link>
            <Link
              href={`/workspaces/${slug}/tasks?view=list`}
              className={`rounded-md px-3 py-1 text-sm ${
                view === "list"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              List
            </Link>
          </div>
          <Button asChild>
            <Link href={`/workspaces/${slug}/tasks/new`}>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Link>
          </Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={CheckSquare}
              title="No tasks yet"
              description="Create your first task or extract action items from meetings."
              action={{
                label: "New Task",
                href: `/workspaces/${slug}/tasks/new`,
              }}
            />
          </CardContent>
        </Card>
      ) : view === "board" ? (
        <TaskBoard
          tasks={tasks}
          members={members.map((m) => m.user)}
          slug={slug}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/workspaces/${slug}/tasks/${task.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        task.status === "DONE"
                          ? "bg-green-500"
                          : task.status === "IN_PROGRESS"
                            ? "bg-blue-500"
                            : "bg-gray-300"
                      }`}
                    />
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {task.assignee && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assignee.name || task.assignee.email}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                        {task.meeting && (
                          <span className="text-xs">
                            From: {task.meeting.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        task.priority === "HIGH" || task.priority === "CRITICAL"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {task.priority}
                    </Badge>
                    <Badge variant="outline">{task.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
