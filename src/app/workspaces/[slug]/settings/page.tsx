import { Metadata } from "next";
import { Settings, Building2, CreditCard, Key, Bell, Webhook } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/lib/auth-helpers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettings } from "./general-settings";
import { BillingSettings } from "./billing-settings";

export const metadata: Metadata = {
  title: "Settings | AI Meeting Intelligence",
  description: "Manage your workspace settings",
};

interface SettingsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function SettingsPage({ params, searchParams }: SettingsPageProps) {
  const { slug } = await params;
  const { tab = "general" } = await searchParams;

  const organization = await prisma.organization.findUnique({
    where: { slug },
    include: {
      subscriptions: true,
    },
  });

  if (!organization) {
    return null;
  }

  const { membership } = await requireOrganizationAccess(organization.id);
  const isOwnerOrAdmin = ["OWNER", "ADMIN"].includes(membership.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your workspace settings and preferences
        </p>
      </div>

      <Tabs defaultValue={tab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Building2 className="h-4 w-4" />
            General
          </TabsTrigger>
          {isOwnerOrAdmin && (
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
          )}
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          {isOwnerOrAdmin && (
            <TabsTrigger value="api" className="gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings
            organization={organization}
            canEdit={isOwnerOrAdmin}
            slug={slug}
          />
        </TabsContent>

        {isOwnerOrAdmin && (
          <TabsContent value="billing">
            <BillingSettings
              organization={organization}
              subscription={organization.subscriptions[0]}
            />
          </TabsContent>
        )}

        <TabsContent value="notifications">
          <div className="rounded-lg border p-6">
            <h3 className="text-lg font-semibold">Notification Preferences</h3>
            <p className="text-sm text-muted-foreground">
              Configure how you want to receive notifications
            </p>
            <div className="mt-6 space-y-4">
              <p className="text-muted-foreground">
                Notification settings coming soon...
              </p>
            </div>
          </div>
        </TabsContent>

        {isOwnerOrAdmin && (
          <TabsContent value="api">
            <div className="rounded-lg border p-6">
              <h3 className="text-lg font-semibold">API Keys</h3>
              <p className="text-sm text-muted-foreground">
                Manage API keys for programmatic access
              </p>
              <div className="mt-6 space-y-4">
                <p className="text-muted-foreground">
                  API key management coming soon...
                </p>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
