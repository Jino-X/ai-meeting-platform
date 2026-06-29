"use client";

import { useState } from "react";
import { CreditCard, Check, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Organization {
  id: string;
  name: string;
  plan: string;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: Date | null;
  usageMeetings: number;
  usageAiMinutes: number;
}

interface BillingSettingsProps {
  organization: Organization;
  subscription?: Subscription | null;
}

const plans = [
  {
    name: "FREE",
    price: "$0",
    description: "For individuals getting started",
    features: [
      "5 meetings per month",
      "60 minutes AI processing",
      "Basic transcription",
      "1 workspace member",
    ],
    limits: { meetings: 5, aiMinutes: 60 },
  },
  {
    name: "PRO",
    price: "$29",
    description: "For growing teams",
    features: [
      "Unlimited meetings",
      "600 minutes AI processing",
      "Advanced transcription",
      "Up to 10 members",
      "Priority support",
    ],
    limits: { meetings: -1, aiMinutes: 600 },
    popular: true,
  },
  {
    name: "ENTERPRISE",
    price: "$99",
    description: "For large organizations",
    features: [
      "Unlimited meetings",
      "6000 minutes AI processing",
      "Custom AI models",
      "Unlimited members",
      "SSO & advanced security",
      "Dedicated support",
    ],
    limits: { meetings: -1, aiMinutes: 6000 },
  },
];

export function BillingSettings({
  organization,
  subscription,
}: BillingSettingsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const currentPlan = plans.find((p) => p.name === organization.plan) || plans[0];
  const usage = {
    meetings: subscription?.usageMeetings || 0,
    aiMinutes: subscription?.usageAiMinutes || 0,
  };

  async function handleUpgrade(planName: string) {
    setIsLoading(planName);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Something went wrong");
        return;
      }

      if (result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>
            You are currently on the {organization.plan} plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{currentPlan.price}/month</h3>
              <p className="text-sm text-muted-foreground">
                {currentPlan.description}
              </p>
            </div>
            <Badge variant="secondary" className="text-lg">
              {organization.plan}
            </Badge>
          </div>

          {subscription?.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              Current period ends on{" "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}

          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>AI Processing Minutes</span>
                <span>
                  {usage.aiMinutes} / {currentPlan.limits.aiMinutes} used
                </span>
              </div>
              <Progress
                value={(usage.aiMinutes / currentPlan.limits.aiMinutes) * 100}
              />
            </div>

            {currentPlan.limits.meetings > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Meetings</span>
                  <span>
                    {usage.meetings} / {currentPlan.limits.meetings} used
                  </span>
                </div>
                <Progress
                  value={(usage.meetings / currentPlan.limits.meetings) * 100}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={
              plan.popular
                ? "border-primary shadow-lg"
                : plan.name === organization.plan
                  ? "border-2"
                  : ""
            }
          >
            <CardHeader>
              {plan.popular && (
                <Badge className="mb-2 w-fit">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Most Popular
                </Badge>
              )}
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="pt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.name === organization.plan ? (
                <Button className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleUpgrade(plan.name)}
                  disabled={isLoading === plan.name}
                >
                  {isLoading === plan.name ? (
                    "Loading..."
                  ) : plan.name === "FREE" ? (
                    "Downgrade"
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Upgrade
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
