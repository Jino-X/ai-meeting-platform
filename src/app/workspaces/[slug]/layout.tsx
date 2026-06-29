import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserOrganizations, getCurrentMembership } from "@/lib/auth-helpers";
import { Shell } from "@/components/layout/shell";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { slug } = await params;
  const user = await requireAuth();

  const organization = await prisma.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
    },
  });

  if (!organization) {
    notFound();
  }

  const membership = await getCurrentMembership(organization.id, user.id);

  if (!membership || membership.status !== "ACTIVE") {
    notFound();
  }

  const organizations = await getUserOrganizations(user.id);

  return (
    <Shell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image ?? null,
      }}
      organizations={organizations}
      currentOrg={organization}
    >
      {children}
    </Shell>
  );
}
