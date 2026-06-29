import Link from "next/link";
import {
  Video,
  Sparkles,
  CheckSquare,
  BarChart3,
  Users,
  Zap,
  ArrowRight,
  Play,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Video,
    title: "Meeting Recording",
    description:
      "Automatically record and store your meetings from Zoom, Google Meet, or upload recordings directly.",
  },
  {
    icon: Sparkles,
    title: "AI Transcription",
    description:
      "Get accurate transcriptions powered by OpenAI Whisper with speaker identification.",
  },
  {
    icon: CheckSquare,
    title: "Action Items",
    description:
      "AI automatically extracts action items and assigns them to team members.",
  },
  {
    icon: BarChart3,
    title: "Smart Summaries",
    description:
      "Get executive summaries, key points, decisions, and risks from every meeting.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Share meetings, assign tasks, and collaborate with your team in real-time.",
  },
  {
    icon: Zap,
    title: "Integrations",
    description:
      "Connect with Slack, Zoom, Google Calendar, and more for seamless workflows.",
  },
];

const stats = [
  { value: "10x", label: "Faster meeting notes" },
  { value: "95%", label: "Transcription accuracy" },
  { value: "50%", label: "Less time in follow-ups" },
  { value: "100%", label: "Action item capture" },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">MeetingAI</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm hover:text-primary">
              Features
            </Link>
            <Link href="#pricing" className="text-sm hover:text-primary">
              Pricing
            </Link>
            <Link href="#about" className="text-sm hover:text-primary">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-sm">
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              AI-Powered Meeting Intelligence
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Turn Every Meeting Into
              <span className="text-primary"> Actionable Insights</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Automatically transcribe, summarize, and extract action items from
              your meetings. Never miss a follow-up again.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#demo">
                  <Play className="mr-2 h-4 w-4" />
                  Watch Demo
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/50 py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-primary md:text-4xl">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="container mx-auto px-4 py-24">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Everything You Need for Smarter Meetings
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Our AI-powered platform handles the tedious work so you can focus
              on what matters most.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Ready to Transform Your Meetings?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
              Join thousands of teams who are saving hours every week with
              AI-powered meeting intelligence.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required • 14-day free trial
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold">MeetingAI</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MeetingAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
