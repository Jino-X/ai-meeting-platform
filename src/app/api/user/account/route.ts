import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { signOut } from "@/lib/auth";

export async function DELETE(request: Request) {
  try {
    const user = await requireAuth();

    // Check if user owns any organizations
    const ownedOrgs = await prisma.organization.count({
      where: { ownerId: user.id },
    });

    if (ownedOrgs > 0) {
      return NextResponse.json(
        { error: "You must transfer ownership or delete all workspaces you own before deleting your account" },
        { status: 400 }
      );
    }

    // Delete user account (cascade will handle related records)
    await prisma.user.delete({
      where: { id: user.id },
    });

    // Sign out the user
    await signOut();

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
