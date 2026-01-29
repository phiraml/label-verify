"use client";

import { useState, useCallback } from "react";
import { UploadZone } from "@/components/upload-zone";
import { ImageViewer } from "@/components/image-viewer";
import { ExtractionResult } from "@/components/extraction-result";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { ExtractionResponse } from "@/lib/types";

export default function QuickCheckPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<ExtractionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setResult(null);
    setError(null);
    if (selectedFiles.length > 0) {
      const url = URL.createObjectURL(selectedFiles[0]);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  }, []);

  const handleExtract = async () => {
    if (files.length === 0) return;

    setExtracting(true);
    setError(null);
    setResult(null);

    try {
      const file = files[0];
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Extraction failed");
      }

      const data = (await res.json()) as ExtractionResponse;
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Extraction failed"
      );
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold mb-2">Quick Check</h1>
        <p className="text-muted-foreground mb-6">
          Upload a label image to extract all fields. Compare manually
          against your COLA application screen.
        </p>

        <div className="space-y-6">
          {/* Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Upload Label Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UploadZone onFilesSelected={handleFilesSelected} />
            </CardContent>
          </Card>

          {/* Analyze Button */}
          {files.length > 0 && !result && (
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleExtract}
                disabled={extracting}
                className="px-8"
              >
                {extracting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing Label...
                  </>
                ) : (
                  "Analyze Label"
                )}
              </Button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left: Image */}
              <div>
                <h2 className="font-semibold mb-3">Label Image</h2>
                {imagePreview && <ImageViewer src={imagePreview} />}
              </div>

              {/* Right: Extraction Result */}
              <div>
                <h2 className="font-semibold mb-3">
                  Extracted Information
                </h2>
                <ExtractionResult
                  extractedFields={result.extracted_fields}
                  detectedProductType={result.detected_product_type}
                  confidence={result.confidence}
                  imageQuality={result.image_quality}
                  validationNotes={result.validation_notes}
                  processingTimeMs={result.processing_time_ms}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
