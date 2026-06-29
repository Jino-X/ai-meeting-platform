import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/lib/auth-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const organization = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const { user } = await requireOrganizationAccess(organization.id);

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        organizationId: organization.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const organization = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const { user } = await requireOrganizationAccess(organization.id);

    if (body.markAllAsRead) {
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          organizationId: organization.id,
          status: "UNREAD",
        },
        data: {
          status: "READ",
        },
      });

      return NextResponse.json({ message: "All notifications marked as read" });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Notifications update error:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
