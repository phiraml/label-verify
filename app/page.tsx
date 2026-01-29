import { ModeSelector } from "@/components/mode-selector";
import { Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl text-center mb-12">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Label Verification
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          AI-powered compliance checking for alcohol beverage labels. Upload a
          label image and verify it against COLA application data in seconds.
        </p>
      </div>

      <div className="mx-auto max-w-5xl">
        <ModeSelector />
      </div>

      <div className="mx-auto max-w-2xl mt-16 text-center">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Demo Application IDs
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { id: "COL-2024-78432", label: "Bourbon Whiskey" },
            { id: "COL-2024-78434", label: "Chardonnay Wine" },
            { id: "COL-2024-78438", label: "Golden Ale" },
            { id: "COL-2024-78440", label: "Rye Whiskey (Box 15)" },
          ].map((app) => (
            <div
              key={app.id}
              className="rounded-md border bg-muted/50 px-3 py-1.5 text-xs"
            >
              <span className="font-mono font-medium">{app.id}</span>
              <span className="text-muted-foreground ml-1.5">
                {app.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
