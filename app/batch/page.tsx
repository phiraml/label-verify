"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { UploadZone } from "@/components/upload-zone";
import { BatchProgress } from "@/components/batch-progress";
import { BatchResultsTable } from "@/components/batch-results-table";
import { VerificationResult } from "@/components/verification-result";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ApplicationData, BatchResultItem } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  spirits: "Spirits",
  wine: "Wine",
  malt_beverage: "Malt Beverage",
};

export default function BatchPage() {
  const [mode, setMode] = useState<"bundled" | "upload">("bundled");

  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [selectedApps, setSelectedApps] = useState<ApplicationData[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<BatchResultItem[]>([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [counts, setCounts] = useState({
    approved: 0,
    needsReview: 0,
    rejected: 0,
    errors: 0,
  });
  const [selectedResult, setSelectedResult] =
    useState<BatchResultItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    async function fetchApplications() {
      try {
        const res = await fetch("/api/applications");
        if (!res.ok) throw new Error("Failed to load applications");
        const data = await res.json();
        setApplications(data.applications);
      } catch {
        // ignore - bundled mode just won't be available
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

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setResults([]);
    setError(null);
    setProgress({ completed: 0, total: 0 });
    setCounts({ approved: 0, needsReview: 0, rejected: 0, errors: 0 });
  }, []);

  const addApp = (id: string) => {
    const app = applications.find((a) => a.id === id);
    if (app && !selectedApps.some((s) => s.id === app.id)) {
      setSelectedApps((prev) => [...prev, app]);
      setResults([]);
      setError(null);
    }
  };

  const removeApp = (id: string) => {
    setSelectedApps((prev) => prev.filter((a) => a.id !== id));
  };

  const fileToBase64 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let j = 0; j < bytes.byteLength; j++) {
      binary += String.fromCharCode(bytes[j]);
    }
    return btoa(binary);
  };

  const fetchImageAsBase64 = async (url: string): Promise<string> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let j = 0; j < bytes.byteLength; j++) {
      binary += String.fromCharCode(bytes[j]);
    }
    return btoa(binary);
  };

  const handleProcess = async () => {
    const isBundled = mode === "bundled";
    const itemCount = isBundled ? selectedApps.length : files.length;
    if (itemCount === 0) return;

    setProcessing(true);
    setError(null);
    setResults([]);
    setProgress({ completed: 0, total: itemCount });
    setCounts({ approved: 0, needsReview: 0, rejected: 0, errors: 0 });

    try {
      let items;

      if (isBundled) {
        items = await Promise.all(
          selectedApps.map(async (app) => {
            if (!app.label_image_url) {
              throw new Error(`Application ${app.id} has no bundled image`);
            }
            const base64 = await fetchImageAsBase64(app.label_image_url);
            return {
              id: app.id,
              image: base64,
              application_id: app.id,
            };
          })
        );
      } else {
        const demoIds = ["COL-2024-78432", "COL-2024-78434", "COL-2024-78438", "COL-2024-78440"];
        items = await Promise.all(
          files.map(async (file, i) => {
            const base64 = await fileToBase64(file);
            return {
              id: file.name,
              image: base64,
              application_id: demoIds[i % demoIds.length],
            };
          })
        );
      }

      abortRef.current = new AbortController();

      const res = await fetch("/api/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Batch processing failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            if (eventType === "result") {
              setResults((prev) => [...prev, data as BatchResultItem]);
            } else if (eventType === "progress") {
              setProgress({
                completed: data.completed,
                total: data.total,
              });
            } else if (eventType === "complete") {
              setCounts({
                approved: data.approved,
                needsReview: data.needs_review,
                rejected: data.rejected,
                errors: data.errors,
              });
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(
        err instanceof Error ? err.message : "Batch processing failed"
      );
    } finally {
      setProcessing(false);
      abortRef.current = null;
    }
  };

  const readyCount = mode === "bundled" ? selectedApps.length : files.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold mb-2">Batch Processing</h1>
        <p className="text-muted-foreground mb-6">
          Process multiple labels for bulk verification. Select applications
          with bundled images or upload label files manually.
        </p>

        <div className="space-y-6">
          <div className="flex gap-2">
            <Button
              variant={mode === "bundled" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("bundled")}
            >
              Select Applications
            </Button>
            <Button
              variant={mode === "upload" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("upload")}
            >
              Upload Images
            </Button>
          </div>

          {mode === "bundled" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Select Applications to Verify
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select onValueChange={addApp}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add an application..." />
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
                          {apps
                            .filter((app) => app.label_image_url)
                            .map((app) => (
                              <SelectItem key={app.id} value={app.id}>
                                <span className="font-mono text-xs">
                                  {app.id}
                                </span>
                                <span className="mx-1.5 text-muted-foreground">
                                  —
                                </span>
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

                {selectedApps.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {selectedApps.length} application
                      {selectedApps.length !== 1 ? "s" : ""} selected
                    </p>
                    <div className="divide-y rounded-lg border">
                      {selectedApps.map((app) => (
                        <div
                          key={app.id}
                          className="flex items-center justify-between px-3 py-2"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-mono text-xs">
                              {app.id}
                            </span>
                            <span className="text-muted-foreground">—</span>
                            <span>{app.brand_name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({app.class_type})
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeApp(app.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApps.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Select applications from the dropdown. Each will be
                    verified using its bundled label image.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {mode === "upload" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Upload Label Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <UploadZone
                  multiple
                  maxFiles={50}
                  onFilesSelected={handleFilesSelected}
                />
                <div className="text-sm text-muted-foreground">
                  For demo purposes, images will be automatically matched to
                  sample applications (COL-2024-78432, 78434, 78438, 78440).
                </div>
              </CardContent>
            </Card>
          )}

          {readyCount > 0 && !processing && results.length === 0 && (
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleProcess}
                className="px-8"
              >
                <Play className="mr-2 h-5 w-5" />
                Process {readyCount} Label
                {readyCount !== 1 ? "s" : ""}
              </Button>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive">
              {error}
            </div>
          )}

          {(processing || results.length > 0) && (
            <Card>
              <CardContent className="pt-6">
                <BatchProgress
                  completed={progress.completed}
                  total={progress.total}
                  approved={counts.approved || results.filter((r) => r.status === "APPROVED").length}
                  needsReview={counts.needsReview || results.filter((r) => r.status === "NEEDS_REVIEW").length}
                  rejected={counts.rejected || results.filter((r) => r.status === "REJECTED").length}
                  errors={counts.errors || results.filter((r) => r.error).length}
                  isProcessing={processing}
                />
              </CardContent>
            </Card>
          )}

          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Results</CardTitle>
              </CardHeader>
              <CardContent>
                <BatchResultsTable
                  results={results}
                  onViewDetail={setSelectedResult}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog
        open={!!selectedResult}
        onOpenChange={(open) => {
          if (!open) setSelectedResult(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Verification Detail: {selectedResult?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedResult?.result && selectedResult.image_quality && (
            <VerificationResult
              result={selectedResult.result}
              imageQuality={selectedResult.image_quality}
              processingTimeMs={selectedResult.processing_time_ms}
            />
          )}
          {selectedResult?.error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
              Error: {selectedResult.error}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
