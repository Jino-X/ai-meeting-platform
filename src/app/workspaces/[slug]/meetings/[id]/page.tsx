import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Video,
  Calendar,
  Clock,
  Users,
  FileText,
  Sparkles,
  CheckSquare,
  Play,
  Upload,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/lib/auth-helpers";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TranscriptView } from "./transcript-view";
import { SummaryPanel } from "./summary-panel";
import { ActionItemsList } from "./action-items-list";

export const metadata: Metadata = {
  title: "Meeting Details | AI Meeting Intelligence",
  description: "View meeting details, transcript, and summary",
};

interface MeetingDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  SCHEDULED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
};

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { slug, id } = await params;

  const organization = await prisma.organization.findUnique({
    where: { slug },
  });

  if (!organization) {
    notFound();
  }

  await requireOrganizationAccess(organization.id);

  const meeting = await prisma.meeting.findFirst({
    where: {
      id,
      organizationId: organization.id,
    },
    include: {
      recordings: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      transcript: {
        include: {
          segments: {
            orderBy: { startTime: "asc" },
          },
        },
      },
      summary: true,
      actionItems: {
        include: {
          owner: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!meeting) {
    notFound();
  }

  const recording = meeting.recordings[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/workspaces/${slug}/meetings`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{meeting.title}</h1>
            <Badge variant={statusColors[meeting.status] || "default"}>
              {meeting.status}
            </Badge>
          </div>
          {meeting.description && (
            <p className="mt-2 text-muted-foreground">{meeting.description}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {meeting.scheduledAt
                ? formatDate(meeting.scheduledAt)
                : formatDate(meeting.createdAt)}
            </span>
            {meeting.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {meeting.duration} minutes
              </span>
            )}
            {meeting.participants.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {meeting.participants.length} participants
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {!recording && (
            <Button asChild>
              <Link href={`/workspaces/${slug}/meetings/${id}/upload`}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Recording
              </Link>
            </Button>
          )}
          {meeting.status === "SCHEDULED" && (
            <Button variant="outline">
              <Play className="mr-2 h-4 w-4" />
              Start Meeting
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {recording && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Recording
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Recording player placeholder
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {meeting.transcript ? (
            <TranscriptView
              transcript={meeting.transcript}
              segments={meeting.transcript.segments}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">
                    No transcript available yet
                  </p>
                  {recording && (
                    <Button className="mt-4" variant="outline">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Transcript
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {meeting.summary ? (
            <SummaryPanel summary={meeting.summary} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">
                    No summary available yet
                  </p>
                  {meeting.transcript && (
                    <Button className="mt-4" variant="outline">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Summary
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <ActionItemsList
            actionItems={meeting.actionItems}
            slug={slug}
            meetingId={id}
          />

          {meeting.participants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {meeting.participants.map((email) => (
                    <div
                      key={email}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                        {email.charAt(0).toUpperCase()}
                      </div>
                      {email}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
