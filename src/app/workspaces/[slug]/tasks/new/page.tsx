import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireOrganizationAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { TaskForm } from "./task-form";

export const metadata: Metadata = {
  title: "New Task | AI Meeting Intelligence",
  description: "Create a new task",
};

interface NewTaskPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewTaskPage({ params }: NewTaskPageProps) {
  const { slug } = await params;

  const organization = await prisma.organization.findUnique({
    where: { slug },
  });

  if (!organization) {
    return null;
  }

  await requireOrganizationAccess(organization.id);

  const members = await prisma.membership.findMany({
    where: { organizationId: organization.id, status: "ACTIVE" },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/workspaces/${slug}/tasks`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to tasks
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold">New Task</h1>
        <p className="text-muted-foreground">Create a new task for your team</p>
      </div>

      <TaskForm slug={slug} members={members.map((m) => m.user)} />
    </div>
  );
}
