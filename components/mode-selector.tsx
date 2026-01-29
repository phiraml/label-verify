import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClipboardCheck, Zap, Layers } from "lucide-react";

const modes = [
  {
    href: "/verify",
    title: "Full Verify",
    description:
      "Enter a COLA application ID and upload a label image. The AI compares every field against the application data and returns a detailed compliance report.",
    icon: ClipboardCheck,
    detail: "Best for thorough review",
  },
  {
    href: "/quick-check",
    title: "Quick Check",
    description:
      "Upload a label image and the AI extracts all visible fields. Use this for fast triage or when you want to manually compare against your COLA screen.",
    icon: Zap,
    detail: "Fast field extraction",
  },
  {
    href: "/batch",
    title: "Batch Processing",
    description:
      "Upload multiple label images for bulk verification. See real-time progress and sort results by status. Ideal for large submissions.",
    icon: Layers,
    detail: "Process many labels at once",
  },
];

export function ModeSelector() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {modes.map((mode) => {
        const Icon = mode.icon;
        return (
          <Link key={mode.href} href={mode.href} className="group">
            <Card className="h-full transition-all group-hover:shadow-md group-hover:border-primary/50">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{mode.title}</CardTitle>
                <CardDescription>{mode.detail}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {mode.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
