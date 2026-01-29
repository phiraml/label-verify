"use client";

import { GovernmentWarningCheck } from "./government-warning-check";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import type { ExtractedFields, ImageQuality, Confidence, ProductType } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

const FIELD_LABELS: Record<string, string> = {
  brand_name: "Brand Name",
  fanciful_name: "Fanciful Name",
  class_type: "Class/Type",
  abv: "Alcohol Content",
  proof: "Proof",
  net_contents: "Net Contents",
  producer_name: "Producer Name",
  producer_address: "Producer Address",
  country_of_origin: "Country of Origin",
  vintage_year: "Vintage Year",
  appellation: "Appellation",
};

interface ExtractionResultProps {
  extractedFields: ExtractedFields;
  detectedProductType: ProductType | null;
  confidence: Confidence;
  imageQuality: ImageQuality;
  validationNotes: string[];
  processingTimeMs: number;
}

export function ExtractionResult({
  extractedFields,
  detectedProductType,
  confidence,
  imageQuality,
  validationNotes,
  processingTimeMs,
}: ExtractionResultProps) {
  const fieldEntries = Object.entries(extractedFields).filter(
    ([key]) => key !== "government_warning"
  ) as [string, string | null][];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {detectedProductType && (
            <Badge variant="outline" className="capitalize">
              {detectedProductType.replace("_", " ")}
            </Badge>
          )}
          <Badge variant="outline">Confidence: {confidence}</Badge>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {(processingTimeMs / 1000).toFixed(1)}s
        </div>
      </div>

      {/* Image Quality Warning */}
      {!imageQuality.readable && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Image Quality Issues</p>
            <p className="text-sm text-yellow-700">
              {imageQuality.issues.join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Extracted Fields */}
      <div>
        <h3 className="font-semibold mb-3">Extracted Fields</h3>
        <div className="rounded-lg border divide-y">
          {fieldEntries.map(([key, value]) => (
            <div key={key} className="flex items-center px-4 py-2.5">
              <span className="w-40 shrink-0 text-sm font-medium text-muted-foreground">
                {FIELD_LABELS[key] || key}
              </span>
              <span className="text-sm">
                {value || (
                  <span className="text-muted-foreground italic">
                    Not found
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Government Warning */}
      {extractedFields.government_warning && (
        <div>
          <h3 className="font-semibold mb-3">Government Warning Analysis</h3>
          <GovernmentWarningCheck
            warning={extractedFields.government_warning}
          />
        </div>
      )}

      {/* Validation Notes */}
      {validationNotes.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-2">Validation Notes</h3>
          <ul className="space-y-1">
            {validationNotes.map((note, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
