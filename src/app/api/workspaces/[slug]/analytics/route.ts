import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const organization = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const membership = await prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: session.user.id,
        },
      },
    });

    if (!membership || membership.status !== "ACTIVE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const meetingWhere: Record<string, unknown> = {
      organizationId: organization.id,
    };
    if (Object.keys(dateFilter).length > 0) {
      meetingWhere.createdAt = dateFilter;
    }

    const [
      totalMeetings,
      completedMeetings,
      totalTasks,
      completedTasks,
      totalMembers,
      meetings,
    ] = await Promise.all([
      prisma.meeting.count({ where: meetingWhere }),
      prisma.meeting.count({
        where: { ...meetingWhere, status: "COMPLETED" },
      }),
      prisma.task.count({ where: { organizationId: organization.id } }),
      prisma.task.count({
        where: { organizationId: organization.id, status: "DONE" },
      }),
      prisma.membership.count({
        where: { organizationId: organization.id, status: "ACTIVE" },
      }),
      prisma.meeting.findMany({
        where: meetingWhere,
        select: {
          duration: true,
        },
      }),
    ]);

    const totalDurationMinutes = meetings.reduce(
      (acc: number, m: { duration: number | null }) => acc + (m.duration || 0),
      0
    );

    const subscription = await prisma.subscription.findFirst({
      where: { organizationId: organization.id },
    });

    return NextResponse.json({
      data: {
        totalMeetings,
        completedMeetings,
        totalDurationMinutes,
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
        totalMembers,
        aiUsageMinutes: subscription?.usageAiMinutes || 0,
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
