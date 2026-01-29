"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadZone } from "@/components/upload-zone";
import type { ApplicationData, ProductType } from "@/lib/types";

interface ApplicationLookupProps {
  onApplicationLoaded: (app: ApplicationData, manualImageFile?: File) => void;
}

const TYPE_LABELS: Record<string, string> = {
  spirits: "Spirits",
  wine: "Wine",
  malt_beverage: "Malt Beverage",
};

export function ApplicationLookup({
  onApplicationLoaded,
}: ApplicationLookupProps) {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"select" | "manual">("select");
  const [manualImageFile, setManualImageFile] = useState<File | null>(null);

  const [manual, setManual] = useState({
    id: "",
    brand_name: "",
    product_type: "spirits" as ProductType,
    class_type: "",
    abv: "",
    net_contents: "",
    producer_name: "",
    producer_address: "",
    fanciful_name: "",
    country_of_origin: "",
    vintage_year: "",
    appellation: "",
    age_statement: "",
    container_markings: "",
  });

  useEffect(() => {
    async function fetchApplications() {
      try {
        const res = await fetch("/api/applications");
        if (!res.ok) throw new Error("Failed to load applications");
        const data = await res.json();
        setApplications(data.applications);
      } catch {
        setError("Failed to load applications");
      } finally {
        setLoading(false);
      }
    }
    fetchApplications();
  }, []);

  const grouped = applications.reduce<Record<string, ApplicationData[]>>(
    (acc, app) => {
      const type = app.product_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(app);
      return acc;
    },
    {}
  );

  const groupOrder = ["spirits", "wine", "malt_beverage"];

  const handleManualSubmit = () => {
    if (!manual.brand_name.trim() || !manual.class_type.trim() || !manual.abv.trim()) {
      return;
    }
    const app: ApplicationData = {
      id: manual.id.trim() || `CUSTOM-${Date.now()}`,
      status: "pending",
      submitted_date: new Date().toISOString().split("T")[0],
      applicant_name: manual.producer_name.trim() || "Manual Entry",
      product_type: manual.product_type,
      brand_name: manual.brand_name.trim(),
      class_type: manual.class_type.trim(),
      abv: manual.abv.trim(),
      net_contents: manual.net_contents.trim() || "750 mL",
      producer_name: manual.producer_name.trim(),
      producer_address: manual.producer_address.trim(),
      ...(manual.fanciful_name.trim() && { fanciful_name: manual.fanciful_name.trim() }),
      ...(manual.country_of_origin.trim() && { country_of_origin: manual.country_of_origin.trim() }),
      ...(manual.vintage_year.trim() && { vintage_year: manual.vintage_year.trim() }),
      ...(manual.appellation.trim() && { appellation: manual.appellation.trim() }),
      ...(manual.age_statement.trim() && { age_statement: manual.age_statement.trim() }),
      ...(manual.container_markings.trim() && { container_markings: manual.container_markings.trim() }),
    };
    onApplicationLoaded(app, manualImageFile ?? undefined);
  };

  const setField = (field: string, value: string) => {
    setManual((prev) => ({ ...prev, [field]: value }));
  };

  const canSubmitManual = manual.brand_name.trim() && manual.class_type.trim() && manual.abv.trim();

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          variant={mode === "select" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("select")}
        >
          Select Existing
        </Button>
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("manual")}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Manual Entry
        </Button>
      </div>

      {mode === "select" && (
        <>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading applications...
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <div className="space-y-2">
              <Select
                onValueChange={(id) => {
                  const app = applications.find((a) => a.id === id);
                  if (app) onApplicationLoaded(app);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a COLA application..." />
                </SelectTrigger>
                <SelectContent>
                  {groupOrder.map((type) => {
                    const apps = grouped[type];
                    if (!apps || apps.length === 0) return null;
                    return (
                      <div key={type}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {TYPE_LABELS[type] || type}
                        </div>
                        {apps.map((app) => (
                          <SelectItem key={app.id} value={app.id}>
                            <span className="font-mono text-xs">{app.id}</span>
                            <span className="mx-1.5 text-muted-foreground">—</span>
                            <span>{app.brand_name}</span>
                            <span className="text-muted-foreground ml-1.5 text-xs">
                              ({app.class_type})
                            </span>
                          </SelectItem>
                        ))}
                      </div>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {applications.length} applications available
              </p>
            </div>
          )}
        </>
      )}

      {mode === "manual" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Enter the application data to verify against. Fields marked * are required.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Application ID</Label>
              <Input
                placeholder="e.g., COL-2024-99999"
                value={manual.id}
                onChange={(e) => setField("id", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Brand Name *</Label>
              <Input
                placeholder="e.g., OLD TOM DISTILLERY"
                value={manual.brand_name}
                onChange={(e) => setField("brand_name", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Fanciful Name</Label>
              <Input
                placeholder="e.g., Reserve Collection"
                value={manual.fanciful_name}
                onChange={(e) => setField("fanciful_name", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Product Type *</Label>
              <Select
                value={manual.product_type}
                onValueChange={(v) => setField("product_type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spirits">Spirits</SelectItem>
                  <SelectItem value="wine">Wine</SelectItem>
                  <SelectItem value="malt_beverage">Malt Beverage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Class/Type *</Label>
              <Input
                placeholder="e.g., Kentucky Straight Bourbon Whiskey"
                value={manual.class_type}
                onChange={(e) => setField("class_type", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">ABV *</Label>
              <Input
                placeholder="e.g., 45%"
                value={manual.abv}
                onChange={(e) => setField("abv", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Net Contents</Label>
              <Input
                placeholder="e.g., 750 mL"
                value={manual.net_contents}
                onChange={(e) => setField("net_contents", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Producer Name</Label>
              <Input
                placeholder="e.g., Old Tom Distilling Co."
                value={manual.producer_name}
                onChange={(e) => setField("producer_name", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Producer Address</Label>
              <Input
                placeholder="e.g., 123 Bourbon Trail, Lexington, KY"
                value={manual.producer_address}
                onChange={(e) => setField("producer_address", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Country of Origin</Label>
              <Input
                placeholder="e.g., USA"
                value={manual.country_of_origin}
                onChange={(e) => setField("country_of_origin", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Vintage Year</Label>
              <Input
                placeholder="e.g., 2021"
                value={manual.vintage_year}
                onChange={(e) => setField("vintage_year", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Appellation</Label>
              <Input
                placeholder="e.g., Napa Valley"
                value={manual.appellation}
                onChange={(e) => setField("appellation", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Age Statement</Label>
              <Input
                placeholder="e.g., Aged 12 years"
                value={manual.age_statement}
                onChange={(e) => setField("age_statement", e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Container Markings (Box 15)</Label>
              <Input
                placeholder="e.g., Net contents (750 mL) blown into glass"
                value={manual.container_markings}
                onChange={(e) => setField("container_markings", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Label Image</Label>
            <UploadZone
              onFilesSelected={(files) => setManualImageFile(files[0] ?? null)}
            />
          </div>

          <Button
            onClick={handleManualSubmit}
            disabled={!canSubmitManual}
            className="w-full"
          >
            Load Application
          </Button>
        </div>
      )}
    </div>
  );
}
