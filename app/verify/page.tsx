"use client";

import { useState, useCallback } from "react";
import { ApplicationLookup } from "@/components/application-lookup";
import { ApplicationDataCard } from "@/components/application-data-card";
import { UploadZone } from "@/components/upload-zone";
import { ImageViewer } from "@/components/image-viewer";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Flag, Upload, Clock } from "lucide-react";
import type {
  ApplicationData,
  VerificationResponse,
} from "@/lib/types";

export default function VerifyPage() {
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [bundledImageUrl, setBundledImageUrl] = useState<string | null>(null);
  const [overrideFile, setOverrideFile] = useState<File | null>(null);
  const [overridePreview, setOverridePreview] = useState<string | null>(null);
  const [showOverrideUpload, setShowOverrideUpload] = useState(false);
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [manualPreview, setManualPreview] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideAction, setOverrideAction] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState("");

  const imagePreview = overridePreview ?? manualPreview ?? bundledImageUrl;
  const hasImage = !!(overrideFile || manualFile || bundledImageUrl);

  const handleApplicationLoaded = useCallback(
    (app: ApplicationData, manualImageFile?: File) => {
      setApplication(app);
      setResult(null);
      setError(null);
      setOverrideFile(null);
      setOverridePreview(null);
      setShowOverrideUpload(false);
      setManualFile(null);
      setManualPreview(null);

      if (app.label_image_url) {
        setBundledImageUrl(app.label_image_url);
      } else {
        setBundledImageUrl(null);
      }

      if (manualImageFile) {
        setManualFile(manualImageFile);
        setManualPreview(URL.createObjectURL(manualImageFile));
      }
    },
    []
  );

  const handleOverrideFilesSelected = useCallback((selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      const file = selectedFiles[0];
      setOverrideFile(file);
      setOverridePreview(URL.createObjectURL(file));
    } else {
      setOverrideFile(null);
      setOverridePreview(null);
    }
  }, []);

  const fileToBase64 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const handleVerify = async () => {
    if (!application || !hasImage) return;

    setVerifying(true);
    setError(null);
    setResult(null);

    try {
      let base64: string;

      if (overrideFile) {
        base64 = await fileToBase64(overrideFile);
      } else if (manualFile) {
        base64 = await fileToBase64(manualFile);
      } else if (bundledImageUrl) {
        const res = await fetch(bundledImageUrl);
        if (!res.ok) throw new Error("Failed to load bundled label image");
        const buffer = await res.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        base64 = btoa(binary);
      } else {
        throw new Error("No image available");
      }

      const isCustom = application.id.startsWith("CUSTOM-");
      const apiRes = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          ...(isCustom
            ? { application_data: application }
            : { application_id: application.id }),
        }),
      });

      if (!apiRes.ok) {
        const data = await apiRes.json();
        throw new Error(data.error || "Verification failed");
      }

      const data = (await apiRes.json()) as VerificationResponse;
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Verification failed"
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleOverride = (action: string) => {
    setOverrideAction(action);
    setOverrideReason("");
    setOverrideDialogOpen(true);
  };

  const confirmOverride = () => {
    setOverrideDialogOpen(false);
    alert(
      `Decision recorded: ${overrideAction}\nReason: ${overrideReason}\n\n(In production, this would be logged to the audit trail.)`
    );
  };

  const isManualEntry = application?.id.startsWith("CUSTOM-");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">Full Verification</h1>

        {!result && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Step 1: Load Application
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ApplicationLookup
                    onApplicationLoaded={handleApplicationLoaded}
                  />
                </CardContent>
              </Card>

              {application && <ApplicationDataCard application={application} />}
            </div>

            <div className="space-y-6">
              {application ? (
                <>
                  {bundledImageUrl && !isManualEntry && (
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Step 2: Label Image
                          </CardTitle>
                          {overridePreview && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              Using uploaded override
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ImageViewer src={overridePreview ?? bundledImageUrl} />
                        {!showOverrideUpload ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => setShowOverrideUpload(true)}
                          >
                            <Upload className="mr-1.5 h-3.5 w-3.5" />
                            Upload different image
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              Upload an image to override the bundled label:
                            </p>
                            <UploadZone onFilesSelected={handleOverrideFilesSelected} />
                            {overrideFile && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  setOverrideFile(null);
                                  setOverridePreview(null);
                                  setShowOverrideUpload(false);
                                }}
                              >
                                Clear override (use bundled image)
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {isManualEntry && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Step 2: Upload Label Image
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {manualPreview ? (
                          <div className="space-y-3">
                            <ImageViewer src={manualPreview} />
                            <p className="text-xs text-muted-foreground">
                              Image provided from manual entry. You can re-upload below.
                            </p>
                            <UploadZone
                              onFilesSelected={(files) => {
                                if (files.length > 0) {
                                  setManualFile(files[0]);
                                  setManualPreview(URL.createObjectURL(files[0]));
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <UploadZone
                            onFilesSelected={(files) => {
                              if (files.length > 0) {
                                setManualFile(files[0]);
                                setManualPreview(URL.createObjectURL(files[0]));
                              }
                            }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {!bundledImageUrl && !isManualEntry && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Step 2: Upload Label Image
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <UploadZone
                          onFilesSelected={(files) => {
                            if (files.length > 0) {
                              setManualFile(files[0]);
                              setManualPreview(URL.createObjectURL(files[0]));
                            }
                          }}
                        />
                        {manualPreview && (
                          <div className="mt-3">
                            <ImageViewer src={manualPreview} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {hasImage && (
                    <div className="flex justify-center">
                      <Button
                        size="lg"
                        onClick={handleVerify}
                        disabled={verifying}
                        className="px-8 w-full"
                      >
                        {verifying ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Analyzing Label...
                          </>
                        ) : (
                          "Verify Label"
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                    Load an application first to upload a label image.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive mt-6">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResult(null)}
              >
                &larr; Back
              </Button>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={result.result.overall_status} size="lg" />
                <Badge variant="outline" className="text-sm">
                  Confidence: {result.result.confidence}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {(result.processing_time_ms / 1000).toFixed(1)}s
                </div>
                <div className="h-6 w-px bg-border" />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-700 border-green-300 hover:bg-green-50"
                    onClick={() => handleOverride("APPROVE")}
                  >
                    <CheckCircle className="mr-1.5 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-700 border-red-300 hover:bg-red-50"
                    onClick={() => handleOverride("REJECT")}
                  >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                    onClick={() => handleOverride("FLAG")}
                  >
                    <Flag className="mr-1.5 h-4 w-4" />
                    Flag for Review
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 className="font-semibold mb-3">Label Image</h2>
                {imagePreview && <ImageViewer src={imagePreview} />}
              </div>

              <div>
                <h2 className="font-semibold mb-3">Verification Results</h2>
                <VerificationResult
                  result={result.result}
                  imageQuality={result.image_quality}
                  processingTimeMs={result.processing_time_ms}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={overrideDialogOpen}
        onOpenChange={setOverrideDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {overrideAction === "APPROVE"
                ? "Approve Application"
                : overrideAction === "REJECT"
                  ? "Reject Application"
                  : "Flag for Review"}
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for your decision. This will be
              recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea
              placeholder="Enter your reasoning..."
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOverrideDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmOverride}
                disabled={!overrideReason.trim()}
              >
                Confirm {overrideAction}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
