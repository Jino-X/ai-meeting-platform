import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireOrganizationAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { MeetingForm } from "./meeting-form";

export const metadata: Metadata = {
  title: "New Meeting | AI Meeting Intelligence",
  description: "Schedule a new meeting",
};

interface NewMeetingPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewMeetingPage({ params }: NewMeetingPageProps) {
  const { slug } = await params;

  const organization = await prisma.organization.findUnique({
    where: { slug },
  });

  if (!organization) {
    return null;
  }

  await requireOrganizationAccess(organization.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/workspaces/${slug}/meetings`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to meetings
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold">New Meeting</h1>
        <p className="text-muted-foreground">
          Schedule a new meeting or create one to upload a recording
        </p>
      </div>

      <MeetingForm slug={slug} />
    </div>
  );
}
