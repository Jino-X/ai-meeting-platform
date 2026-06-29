import { Metadata } from "next";
import Link from "next/link";
import { Plus, Video, Calendar, Search, Filter } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/lib/auth-helpers";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Meetings | AI Meeting Intelligence",
  description: "View and manage your meetings",
};

interface MeetingsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  SCHEDULED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
};

export default async function MeetingsPage({ params, searchParams }: MeetingsPageProps) {
  const { slug } = await params;
  const { status, search, page = "1" } = await searchParams;

  const organization = await prisma.organization.findUnique({
    where: { slug },
  });

  if (!organization) {
    return null;
  }

  await requireOrganizationAccess(organization.id);

  const where: Record<string, unknown> = {
    organizationId: organization.id,
  };

  if (status && status !== "all") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const limit = 10;
  const currentPage = parseInt(page);

  const [meetings, total] = await Promise.all([
    prisma.meeting.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * limit,
      take: limit,
      include: {
        transcript: { select: { status: true } },
        summary: { select: { id: true } },
        _count: { select: { actionItems: true } },
      },
    }),
    prisma.meeting.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meetings</h1>
          <p className="text-muted-foreground">
            View and manage your meeting recordings
          </p>
        </div>
        <Button asChild>
          <Link href={`/workspaces/${slug}/meetings/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Meeting
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <form>
                  <Input
                    name="search"
                    placeholder="Search meetings..."
                    defaultValue={search}
                    className="w-[250px] pl-9"
                  />
                </form>
              </div>
              <form>
                <Select name="status" defaultValue={status || "all"}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </form>
            </div>
            <p className="text-sm text-muted-foreground">
              {total} meeting{total !== 1 ? "s" : ""} found
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <EmptyState
              icon={Video}
              title="No meetings found"
              description="Schedule your first meeting or upload a recording to get started."
              action={{
                label: "New Meeting",
                href: `/workspaces/${slug}/meetings/new`,
              }}
            />
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <Link
                  key={meeting.id}
                  href={`/workspaces/${slug}/meetings/${meeting.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Video className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{meeting.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {meeting.scheduledAt
                            ? formatDate(meeting.scheduledAt)
                            : formatDate(meeting.createdAt)}
                          {meeting.duration && (
                            <span>• {meeting.duration} min</span>
                          )}
                          {meeting.participants.length > 0 && (
                            <span>• {meeting.participants.length} participants</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {meeting.transcript && (
                        <Badge variant="outline">
                          {meeting.transcript.status === "COMPLETED"
                            ? "Transcribed"
                            : meeting.transcript.status}
                        </Badge>
                      )}
                      {meeting.summary && (
                        <Badge variant="outline">Summarized</Badge>
                      )}
                      {meeting._count.actionItems > 0 && (
                        <Badge variant="secondary">
                          {meeting._count.actionItems} actions
                        </Badge>
                      )}
                      <Badge variant={statusColors[meeting.status] || "default"}>
                        {meeting.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    {currentPage > 1 && (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/workspaces/${slug}/meetings?page=${currentPage - 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
                        >
                          Previous
                        </Link>
                      </Button>
                    )}
                    {currentPage < totalPages && (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/workspaces/${slug}/meetings?page=${currentPage + 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
                        >
                          Next
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
