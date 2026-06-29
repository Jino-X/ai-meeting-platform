import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role } from "@prisma/client";

export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      createdAt: true,
    },
  });

  return user;
});

export const requireAuth = async () => {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
};

export const getCurrentMembership = cache(
  async (organizationId: string, userId: string) => {
    const membership = await prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      include: {
        organization: true,
      },
    });

    return membership;
  }
);

export const getUserOrganizations = cache(async (userId: string) => {
  const memberships = await prisma.membership.findMany({
    where: {
      userId,
      status: "ACTIVE",
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          plan: true,
        },
      },
    },
    orderBy: {
      joinedAt: "desc",
    },
  });

  return memberships.map((m) => ({
    ...m.organization,
    role: m.role,
  }));
});

export const requireOrganizationAccess = async (
  organizationId: string,
  requiredRoles?: Role[]
) => {
  const user = await requireAuth();

  const membership = await getCurrentMembership(organizationId, user.id);

  if (!membership || membership.status !== "ACTIVE") {
    redirect("/workspaces");
  }

  if (requiredRoles && !requiredRoles.includes(membership.role)) {
    redirect(`/workspaces/${membership.organization.slug}`);
  }

  return { user, membership };
};

export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 100,
  OWNER: 90,
  ADMIN: 80,
  MANAGER: 50,
  EMPLOYEE: 10,
};

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canManageMembers(role: Role): boolean {
  return hasPermission(role, "ADMIN");
}

export function canManageWorkspace(role: Role): boolean {
  return hasPermission(role, "OWNER");
}

export function canCreateMeetings(role: Role): boolean {
  return hasPermission(role, "EMPLOYEE");
}

export function canDeleteMeetings(role: Role): boolean {
  return hasPermission(role, "MANAGER");
}
